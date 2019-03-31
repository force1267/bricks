const http = require('http');

class Machine {
    constructor({
        api,
        // to ssh to new machine and install bricks on it (not implemented)
        connection : {
            host, // "10.24.193.11"
            port, // 22
            username, // "force"
            password, // "*****"
            secret = '0', // "cattycat"
        } = {},
        address = "admin:admin:0@localhost:22", //user:pass:seret@ip:port for ssh
        initialize = true,

    }) {

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
        const { connection: { host } } = this;
        const self = this;
        // register using this.connection
        http.get(
            `http://${host}:3000?secret=${process.env.SECRET}`, // 3000 is the manager port
            res => {
                if(res.statusCode == 200) {
                    self.manager = true;
                    callback(null);
                } else {
                    self.manager = null;
                    callback(true);
                }
            });
    }

    // ...
}


const machines = [];

function master(req, res) {
    if(req.method == "GET") {
        switch(req.query.route) {
            case "info":
            http
            break;
            case undefined:
            // master admin panel
            return res.sendFile(__dirname + "/www/index.html");
        }
    } else if (req.method == "POST") {
        switch(req.body.route) {

        }
    }
}


module.exports = exports = on = master;
on.get = "/master";
on.post = "/master";
on.spawn = function spawn() {
    // register to localhost
    const local = new Machine({
        api: master,
        address: `::${process.env.SECRET}@localhost:22`,
        initialize: false
    });
    machines.push(local); 

    // load local json db if exists
    // make if not
} 