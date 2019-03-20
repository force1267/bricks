const cluster = require('cluster');
const express = require('express');
const body = require('body-parser');


if(cluster.isMaster) {
    const fs = require('fs');

    const SECRET = process.env.SECRET || '0';


    var master = {
        ip: null,
    };

    const info = {
        ports: [3000],
        workers: [],
        /* worker: {
            name
            port
            get
            post
            db
            file
        } */
    }

    const manager = express();
    manager.use(body.json());

    manager.get("/", (req, res) => {
        if(!master && SECRET === req.body.secret) {
            console.log("master request !")
            master.ip = req.ip;
            res.json({});
            console.log(`master with ip ${req.ip} registered`)

            // TODO
            // manager.post("/install/package")
            // manager.post("/install/npm")

            manager.post("/install", auth, (req, res) => {
                const { name, javascript } = req.body;
                fs.writeFile(
                    `./functions/${name}.js`,
                    javascript,
                    'utf8',
                    err => res.json({ err })
                );
            });

            manager.post("/set", auth, (req, res) => {
                const { name, number } = req.body;
                const target = info.workers.filter(w => w.name == name);
                const now = target.length;
                if(now > number) {
                    // kill workers
                    var diff = now - number;
                    for(var w of target) {
                        if(diff == 0) break;
                        w.worker.process.kill();
                        delete info.ports[info.ports.indexOf(w.port)];
                        delete info.workers[info.workers.indexOf(w)];
                        diff --
                    }
                } else if(now < number) {
                    // spawn workers
                    const fn = require(`./functions/${name}`);
                    var diff = number - now;
                    for(var i = 0; i < diff; i++) {
                        var port = 3000;
                        while(info.ports.includes(port)) port ++
                        cluster.setupMaster({
                            args: [name, port]
                        });
                        const w = {
                            worker: cluster.fork(),
                            port,
                            name,
                            fn,
                            get: fn.get,
                            post: fn.post,
                            db: fn.db,
                            file: fn.file
                        };
                        info.ports.push(port)
                        info.workers.push(w);
                        diff --
                    }
                }
                res.json({});
            });

            manager.get("/info", auth, (req, res) => {
                res.json({
                    info: {
                        uptime: process.uptime(),
                        versions: process.versions,
                        arch: process.arch,
                        platform: process.platform,
                        // TODO
                        // ...
                    }
                });
            });
        }
    });
    manager.listen(3000);

    function auth(req, res , next) {
        if(req.ip !== master.ip) {
            // TODO
            // report. req is not from master
            return;
        }
        next()
    }

    // spawn initial workers
    for(var i = 2; i < process.argv.length; i++) {
        const name = process.argv[i];
        const fn = require(`./functions/${name}`);
        var port = 3000;
        while(info.ports.includes(port)) port ++
        cluster.setupMaster({
            args: [name, port]
        });
        const w = {
            worker: cluster.fork(),
            port,
            name,
            fn,
            get: fn.get,
            post: fn.post,
            db: fn.db,
            file: fn.file
        };
        info.ports.push(port)
        info.workers.push(w);
    }

} else if(cluster.isWorker) {
    console.log(`worker for ${process.argv[2]} is listenig to ${process.argv[3]}`)
    const fn = require(`./functions/${process.argv[2]}`);

    function run(req, res) {
        // TODO
        // implement usage controller
        // and logger
        fn(req, res);
    }
    const app = express();

    // maybe deploy diffrent triggers
    // like get and post on diffrent processes

    if(fn.get) {
        app.get("/", run);
    }

    if(fn.post) {
        app.use(body.json());
        app.post("/", run);
    }

    // TODO
    // load the api into fn
    fn.get = async function get(route) {}
    fn.cache = async function cache(route, duration = 0 /*always*/) {}
    fn.post = async function post(route) {}
    fn.db = async function db(route) {}
    fn.file = {get: async function file(route) {}}
    fn.use = async function use(mw) {
        return await new Promise(resolve => {
            mw(fn.arguments[0], fn.arguments[1], () => {
                clearTimeout(t);
                resolve(true);
            });
            var t = setTimeout(() => resolve(false), 1000); // what else ?
        }).catch(e=>e)
    }

    if(fn.deploy) {
        run({deploy: true})
    }

    app.listen(process.argv[3])
}


