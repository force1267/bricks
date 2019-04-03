const body = require('body-parser');

// export your function this way
module.exports = exports = async function fn(req, res) {
    let next = await fn.use(middleware); // returns true if next() is called
    let root = await fn.get('/');
    let resp = await fn.post('/answer', {answer: 42});
    let db = await fn.db // ...
    let file = await fn.file // ...

}


// export events and end handler this way after the function

// run when spawned a new worker 
exports.spawn = function spwan() {
    console.log("worker spawned !")
}

// run on http get and post
exports.using = [body.jsonn()]
exports.http = "/ping"

// run at a time event
exports.every = 1000
exports.date = Date.now() + 2 * 60 * 1000


// should bricks handle db and files ?!
// run on db or file events
exports.db = ""
exports.file = ""

// after worker dies
exports.end = function finish() {}