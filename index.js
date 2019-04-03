const cluster = require('cluster');
const express = require('express');
const request = require('request');
const body = require('body-parser');

const SECRET = process.env.SECRET || '0';
const PORT = process.env.PORT || 3000;

if(cluster.isMaster) {
    const fs = require('fs');

    var master = {
        ip: null,
    };

    const info = {
        name: "standalone",
        ports: [PORT],
        workers: [],
        /* worker: {
            name
            port
            http
            db
            file
            time...
        } */
    }

    const manager = express();
    manager.use(body.json());

    manager.get("/manager/register", (req, res) => {
        if(!master.ip && SECRET === req.query.secret) {
            console.log(`${info.name}> master with ip ${req.ip} named this machine '${req.query.name}'`)
            master.ip = req.ip;
            info.name = req.query.name || "unnamed";
            res.json({});

            manager.post("/manager/rename", auth, (req, res) => {
                console.log(`${info.name}> renamed to ${req.body.name}`)
                info.name = req.body.name;
                res.json({});
            });
            
            // TODO
            // manager.post("/manager/install/package")
            // manager.post("/manager/install/npm")

            manager.post("/manager/install", auth, (req, res) => {
                const { name, javascript } = req.body;
                const cb = e => fs.writeFile(
                    `./functions/${name}/index.js`,
                    javascript,
                    'utf8',
                    err => res.json({ err })
                );
                fs.mkdir(`./functions/${name}/`, '0777', err => {
                    if (err) {
                        if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
                        else console.error(err); // something else went wrong
                    } else cb(null); // successfully created folder
                });
            });

            manager.post("/manager/set", auth, (req, res) => {
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
                    spawnWorker(name, fn, number - now);
                }
                res.json({});
            });

            manager.get("/manager/info", auth, (req, res) => {
                res.json({
                    info: {
                        uptime: process.uptime(),
                        versions: process.versions,
                        arch: process.arch,
                        platform: process.platform,
                        workers: info.workers.map(w => ({
                            name: w.name,
                            http: w.http,
                        })),
                        // TODO
                        // functions: installed functions
                        // usage: info.usage
                        // ...
                    }
                });
            });
        }
    });
    manager.listen(PORT);
    function auth(req, res , next) {
        if(req.ip !== master.ip) {
            return console.error(`Unauthorized request to manager from ip ${req.ip}`)
        }
        next()
    }
    function spawnWorker(name, fn, n = 1) {
        var port = info.ports[0];
        for(const w of info.workers) {
            if(w.name == name) {
                port = w.port;
            }
        }
        if(port == info.ports[0]) while(info.ports.includes(port)) port ++;
        cluster.setupMaster({
            args: [name, port, info.name]
        });
        for(var i = 0; i < n; i++) {
            const w = {
                worker: cluster.fork(),
                port,
                name,
                fn,
                http: fn.http,
                db: fn.db,
                file: fn.file
            };
            info.ports.push(port);
            info.workers.push(w);
        }
        if(fn.http) {
            manager.all(fn.http, (req, res) => {
                // TODO
                // implement usage controllers
                // should bricks controll usage ?!
                var query = "";
                for(const key in req.query) {
                    query += `${key}=${req.query[key]}&`
                }
                const _req = request({ url: `http://127.0.0.1:${port}?${query}`, body:JSON.stringify(req.body) }).on('error', error => {
                    res.status(500).send(error.message);
                });
                req.pipe(_req).pipe(res);
                // apiProxy.web(req, res, {target: `http://127.0.0.1:${port}/`});
            })
        }
    }

    // spawn initial workers
    for(var i = 2; i < process.argv.length; i++) {
        const name = process.argv[i];
        const fn = require(`./functions/${name}`);
        spawnWorker(name, fn, 1);
    }
    cluster.on("exit", (worker, code, signal) => {
        const w = info.workers.find(w=>w.worker===worker);
        console.log(`${info.name}> worker ${w.name} with port ${w.port} exited with code ${code} signal ${signal} !`)
        cluster.setupMaster({
            args: [w.name, w.port]
        });
        w.worker = cluster.fork();
    });

} else if(cluster.isWorker) {
    const infoname = process.argv[4];
    console.log(`${infoname}> worker for ${process.argv[2]} is listening to ${process.argv[3]}`)
    const fn = require(`./functions/${process.argv[2]}`);

    // TODO
    // load the api into fn
    fn.get = async function get(route) {}
    fn.cache = async function cache(route, duration = 0 /*always*/) {}
    fn.post = async function post(route) {}

    // should brick handle file and db ?!
    fn.db = async function db(route) {}
    fn.file = { get: async function file(route) {} }

    // maybe deploy diffrent triggers
    // like get and post on diffrent processes
    if(fn.get) {
        const app = express();
        for(const mw of fn.using) {
            app.use(mw);
        }
        app.all("/", fn);
        app.listen(process.argv[3])
    }

    if(fn.spawn) {
        // TODO
        // implement usage controller
        // and logger
        fn.spawn();
    }

}


