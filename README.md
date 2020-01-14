# Bricks
### deploy functions to managable NodeJS clusters

#### machines :
a manager is a nodejs script that handles its workers and their requests.

each function deployed to a machine will be called inside a worker.

you can call a function on events like http request, file and database, and time intervals.


#### master :
it is a function that serves the dashboard web app to controll the cluster

#### functions :
nodejs functons like
```javascript
const body = require('body-parser');

module.exports = exports = async function fn(req, res) {
    let next = await fn.use(middleware); // returns true if next() is called
    let root = await fn.get('/');
    let resp = await fn.post('/answer', {answer: 42});
    let db = await fn.db // ...
    let file = await fn.file // ...
    res.end("done")

}

// run when spawned a new worker 
exports.spawn = function spwan() {
    console.log("worker spawned !")
}

exports.using = [body.jsonn()]
exports.http = "/ping" // run on http
```

#### start the main machine :

```bash
PORT=3000 SECRET=keyboardcat node index.js master
```

the 'master' after index.js is machine's initial function.

you can pass as many function as you want.

#### connect to other machines on cluster :

first install Bricks on those machines and start the manager.
```bash
PORT=3000 SECRET=keyboardcat2 node index.js
```
you shouldn't need any initial function. you can install functions from master's dashboard.

the SECRET is used inside master's dashboard to connect to this new machine.

connect using master's dashboard
...

#### when should you use this ?
almost never !

this project is an expriement on clustering and serverless architechture
and it's not suitable for security critical environments.

see kubeless.io

## pre alpha !
project is a work in progress.
