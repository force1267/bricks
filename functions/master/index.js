const http = require('http');
const fs = require('fs');
const body = require('body-parser');

class Machine {
    constructor({
        name = "unnamed",
        connection : {
            host, // "10.24.193.11"
            port, // 3000
            username, // "force"
            password, // "*****"
            secret = '0', // "cattycat"
        } = {},
        address, // = "admin:admin:0@localhost:3000" user:pass:secret@ip:port for ssh
        initialize = true,

    }) {
        this.name = name;
        if (address) {
            const [userpass, hostport] = address.split("@");
            const [username, password, secret] = userpass.split(":");
            const [host, port] = hostport.split(":");
            this.connection = {
                host,
                port,
                username,
                password,
                secret
            }
        } else {
            this.connection = connection;
        }

        if (initialize) {
            this.initialize(console.log);
        } else {
            this.register(console.log);
        }
    }

    initialize(callback) {
        const {} = this;
        // register to machine
        this.register(callback);
        // prepare the worker
        // inject the api to manager
    }

    register(callback) {
        const { name, connection: { host, port, secret } } = this;
        const self = this;
        // register using this.connection
        http.get(`http://${host}:${port}/manager/register?secret=${secret}&name=${name}`, res => {
            if(res.statusCode == 200) {
                self.manager = true;
                callback(null);
            } else {
                self.manager = null;
                cb({ code: res.statusCode });
            }
        });
    }
    rename(name, cb) {
        const { name, connection: { host, port } } = this;
        const self = this;
        // register using this.connection
        console.log("master here ! were posting a rename boy !")
        http.post(`http://${host}:${port}/manager/rename?name=${name}`, res => {
            if(res.statusCode == 200) {
                self.name = name;
                cb(null);
            } else {
                cb({ code: res.statusCode });
            }
        });
    }
    // get info like versions, api and usage
    getInfo(cb) {
        const { connection: { host, port } } = this;
        http.get(`http://${host}:${port}/manager/info`, res => {
            res.on('data', chunk => {
                const data = JSON.parse(chunk);
                cb(null, data);
            });
            if(res.statusCode != 200) {
                cb({ code: res.statusCode });
            }
        });
    }

    // send info about all managers like api info and addresses
    update(cb) {
        const info = [];
        for(var m of machines) {
            info.push(m.getInfo())
        }
    }

    // install a function on the machine
    install() {}

    // ...
}


const machines = [];

function master(req, res) {
    if(req.method == "GET") {
        console.log("GET query: ", req.query)
        switch(req.query.route) {
            case "info":
            machines[0].getInfo(); // TODO
            res.end("ok")
            break;
            case undefined:
            // master admin panel
            return res.sendFile(__dirname + "/www/index.html");
        }
    } else if (req.method == "POST") {
        console.log("POST body: ", req.body)
        switch(req.body.route) {
            case "rename":
            machines[0].rename(req.body.name, err => { // TODO
                res.end("ok")
            });
            break;
        }
    }
}


module.exports = exports = on = master;

master.using= [body.urlencoded({ extended: false }), body.json()];
on.http = "/master";

on.spawn = function spawn() {
    // register to localhost
    const local = new Machine({
        name: "main",
        address: `::${process.env.SECRET}@localhost:${process.env.PORT || 3000}`,
        initialize: false
    });
    machines.push(local);
    fs.stat("./master.json", err => {
        if(!err) {
            fs.readFile('./master.json', 'utf8', (err, json) => {
                if(err) return console.error(err);
                const { machines: ms } = JSON.parse(json);
                for(const m of ms) {
                    const nm = new Machine({
                        connection: m.connection,
                        initialize: false
                    });
                    machines.push(nm);
                }
            });
        } else {
            fs.writeFile("./master.json", JSON.stringify({ machines: [] }), console.error);
        }
    })
} 