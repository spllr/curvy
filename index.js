var http = require("http"),
    fs = require("fs"),
    path = require("path")

var server = http.createServer(function(req, res) {
  switch(req.url) {

    case "/":
      var file = fs.createReadStream(path.join(__dirname, "index.html"))
      res.writeHead(200, {
        "Content-Type": "text/html"
      })
      file.pipe(res)
      break

    case "/engine.js":
      res.writeHead(200, {
        "Content-Type": "application/javascript"
      })
      var file = fs.createReadStream(path.join(__dirname, "engine.js"))
      res.writeHead(200, {
        "Content-Type": "text/html"
      })
      file.pipe(res)
      break

    case "/boot.js":
      res.writeHead(200, {
        "Content-Type": "application/javascript"
      })
      var file = fs.createReadStream(path.join(__dirname, "boot.js"))
      res.writeHead(200, {
        "Content-Type": "text/html"
      })
      file.pipe(res)
      break

    case "/app.css":
      res.writeHead(200, {
        "Content-Type": "application/javascript"
      })
      var file = fs.createReadStream(path.join(__dirname, "app.css"))
      res.writeHead(200, {
        "Content-Type": "text/css"
      })
      file.pipe(res)
      break

    case "/curves.json":
      res.writeHead(200, {
        "Content-Type": "application/json"
      })
      res.end("[]")
      break

    default:
      res.writeHead(404, {
        "Content-Type": "text/plain"
      })
      res.end("Not Found")    
  }
  
})

server.listen(9192, "0.0.0.0")
