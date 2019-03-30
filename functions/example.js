
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
exports.spawn = true

// run on http
exports.get = "/ping"
exports.post = "/ping"

// run at a time
exports.every = 1000
exports.date = Date.now() + 2 * 60 * 1000

// run on db or file events
exports.db = ""
exports.file = ""

// before worker dies
exports.end = function finish() {}