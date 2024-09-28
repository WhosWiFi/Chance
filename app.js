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

app.get('/gold.jpg', function (req, res) {
  fs.readFile('gold.jpg', function (err, data) {
    res.writeHead(200, {'Content-Type': 'image/jpeg'});
    res.write(data);
    return res.end();
  });
});

app.listen(3000, function () {
  console.log('Chance is being hosted at http://localhost:3000');
});