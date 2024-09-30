var express = require('express');
var app = express();
var fs = require('fs');
const path = require('path');
var bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const saltRounds = 10;

// Create a connection pool to the MySQL database
const db = mysql.createPool({
  host: 'localhost',        // MySQL server hostname
  user: 'root',             // MySQL username
  password: 'password',     // MySQL password
  database: 'user_progress'
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

app.get('/', function (req, res) {
    fs.readFile('login.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
      });
});

app.get('/register_page', function (req, res) {
  fs.readFile('registration.html', function (err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      return res.end();
    });
});

app.post('/register', (req, res) => {
  const { username, password, color = 'white' } = req.body; // Default color if not provided

  // Hash the password before storing
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) return res.json({ success: false });

    // Insert user into the database
    const query = 'INSERT INTO users (username, password, color) VALUES (?, ?, ?)';
    db.query(query, [username, hash, color], (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.json({ success: false, message: 'Username already exists' });
        }
        console.error('Database error:', err); // Log the actual error
        return res.json({ success: false, message: 'Database error' });
      }
      res.json({ success: true });
    });
  });
});

// Login users
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) return res.json({ success: false, message: 'Database error' });
    if (results.length === 0) return res.json({ success: false, message: 'User not found' });

    const user = results[0];

    // Compare passwords
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        res.json({ success: true, username });
      } else {
        res.json({ success: false, message: 'Invalid password' });
      }
    });
  });
});


// Endpoint to get user's color
app.get('/get_color', (req, res) => {
  const { username } = req.query; // Extract username from the query parameter

  // SQL query to fetch the user's color
  const query = `SELECT color FROM users WHERE username = '${username}'`;
  
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error fetching color:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch color' });
    }

    // Check if a color was found
    if (results.length > 0) {
      const userColor = results[0].color; // Get the user's color from results
      return res.json({ success: true, color: userColor }); // Return success and color
    } else {
      return res.json({ success: false, message: 'User not found' });
    }
  });
});

// Endpoint to update user's color
app.post('/update_color', (req, res) => {
  const { username, color } = req.body;

  // Update the user's color in the database
  const updateQuery = `UPDATE users SET color = '${color}' WHERE username = '${username}'`;
  console.log(updateQuery);
  db.query(updateQuery, [color, username], (err, results) => {
    if (err) {
      return res.json({ success: false, message: 'Failed to update color' });
    }
    res.json({ success: true, message: 'Color updated successfully' });
  });
});

// Retrieve user's progress and data
app.get('/game', (req, res) => {
  const { username } = req.query;

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(404).send('User not found');

    const user = results[0];
    const userData = {
      color: user.color,
      badges: JSON.parse(user.badges),
      tier_progress: JSON.parse(user.tier_progress),
      achievements: JSON.parse(user.achievements),
    };

    res.json({ success: true, userData });
  });
});

// Endpoint to update user's progress (color, badges, achievements)
app.post('/update-progress', (req, res) => {
  const { username, color, badges, achievements } = req.body;

  const badgesJSON = JSON.stringify(badges);
  const achievementsJSON = JSON.stringify(achievements);

  const query = `
    UPDATE users 
    SET color = ?, badges = ?, achievements = ?
    WHERE username = ?`;

  db.query(query, [color, badgesJSON, achievementsJSON, username], (err, results) => {
    if (err) {
      return res.json({ success: false, message: 'Failed to update progress' });
    }
    res.json({ success: true, message: 'Progress updated successfully' });
  });
});

app.get('/home', function (req, res) {
    fs.readFile('index.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });
});

app.get('/inventory', function (req, res) {
  fs.readFile('inventory.html', function (err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      return res.end();
    });
});

app.get('/background.jpg', function (req, res) {
    fs.readFile('images/background.jpg', function (err, data) {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
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