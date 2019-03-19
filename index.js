
// export your function this way
module.exports = exports = async function fn(req, res) {
    let next = await fn.use(middleware); // returns true if next() is called
    let root = await fn.get('/');
    let resp = await fn.post('/answer', {answer: 42});
    let db = await fn.db // ...
    let file = await fn.file // ...

}


// export events and end handler this way after the function
exports.api = "/main"

exports.now = true

exports.get = "/ping"
exports.post = "/ping"

exports.every = 1000
exports.date = Date.now() + 2 * 60 * 1000

exports.db = ""
exports.file = ""

exports.end = function finish() {}