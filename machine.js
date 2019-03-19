const cluster = require('cluster');
const express = require('express');
const body = require('body-parser');


if(cluster.isMaster) {
    const fs = require('fs');

    const SECRET = process.env.SECRET || '0';


    var master = null;

    const info = {
        ports: [],
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
            
            master = {
                ip: req.ip
            }
            res.end("registered");

            manager.post("/install", (req, res) => {
                if(req.ip !== master.ip) {
                    // TODO
                    // report. req is not from master
                    return;
                }
                const { name, javascript } = req.body;
                fs.writeFile(
                    `./task/${name}.js`,
                    javascript,
                    'utf8',
                    err => res.json({ err })
                );
            });

            manager.post("/set", (req, res) => {
                if(req.ip !== master.ip) {
                    // TODO
                    // report. req is not from master
                    return;
                }
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
                    const fn = require(`./task/${name}.js`);
                    var diff = number - now;
                    for(var i = 0; i < diff; i++) {
                        var port = 3000;
                        while(!info.ports.includes(port)) port ++
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

                // TODO
                // err => res.json({ err });
            });

            manager.get("/info", (req, res) => {
                if(req.ip !== master.ip) {
                    // TODO
                    // report. req is not from master
                    return;
                }
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

    // TODO
    // add default functions from process.argv[2+]
    // ...

} else if(cluster.isWorker) {
    const fn = require(process.argv[2]);

    function run(req, res) {
        // TODO
        // implement
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
    api.listen(process.argv[3])
}


