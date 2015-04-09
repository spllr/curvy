var http = require("http"),
    fs = require("fs"),
    path = require("path")

var server = http.createServer(function(req, res) {
  var file = fs.createReadStream(path.join(__dirname, "index.html"))
  file.pipe(res)
})

server.listen(9192, "0.0.0.0")
