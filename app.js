var express = require('express');
var app = express();
var fs = require('fs');
const path = require('path');
var bodyParser = require('body-parser');

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    fs.readFile('index.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
      });
});

app.get('/default.jpg', function (req, res) {
    fs.readFile('images/default.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.get('/copper.jpg', function (req, res) {
  fs.readFile('images/copper.jpg', function (err, data) {
    res.writeHead(200, {'Content-Type': 'image/jpeg'});
    res.write(data);
    return res.end();
  });
});

app.get('/silver.jpg', function (req, res) {
  fs.readFile('images/silver.jpg', function (err, data) {
    res.writeHead(200, {'Content-Type': 'image/jpeg'});
    res.write(data);
    return res.end();
  });
});

app.get('/gold.jpg', function (req, res) {
  fs.readFile('images/gold.jpg', function (err, data) {
    res.writeHead(200, {'Content-Type': 'image/jpeg'});
    res.write(data);
    return res.end();
  });
});

app.get('/ruby.jpg', function (req, res) {
    fs.readFile('images/ruby.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.get('/sapphire.jpg', function (req, res) {
    fs.readFile('images/sapphire.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.get('/emerald.jpg', function (req, res) {
    fs.readFile('images/emerald.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.get('/diamond.jpg', function (req, res) {
    fs.readFile('images/diamond.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.get('/pink_panther.jpg', function (req, res) {
    fs.readFile('images/pink_panther.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.get('/hope_necklace.jpg', function (req, res) {
    fs.readFile('images/hope_necklace.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.get('/dragon_egg.jpg', function (req, res) {
    fs.readFile('images/dragon_egg.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data);
      return res.end();
    });
});

app.listen(3000, function () {
  console.log('Chance is being hosted at http://localhost:3000');
});