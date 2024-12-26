require('dotenv').config();

// Add this check at the start of your app
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

var express = require('express');
var app = express();
var fs = require('fs');
const path = require('path');
var bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Create a connection pool to the MySQL database
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'chance',
});

// Add logging to see what secret is being used
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');

// Verify JWT middleware
const verifyToken = (req, res, next) => {
  console.log('1. Entering verifyToken middleware');
  console.log('2. Cookies received:', req.cookies);
  
  const token = req.cookies.whoswifi;
  console.log('3. Token found:', token ? 'Yes' : 'No');
  
  if (!token) {
    console.log('4. No token found, redirecting to /');
    return res.redirect('/');
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not available for verification');
    return res.status(500).send('Server configuration error');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('5. Token decoded successfully:', decoded);
    req.username = decoded.username;
    console.log('6. Username set:', req.username);
    next();
  } catch (err) {
    console.log('7. Token verification failed:', err.message);
    console.log('7a. JWT_SECRET available:', !!process.env.JWT_SECRET);
    return res.redirect('/');
  }
};

// Serve login page if no valid token
app.get('/', function (req, res) {
  console.log('8. Handling root route');
  const token = req.cookies.whoswifi;
  console.log('9. Token at root:', token ? 'Yes' : 'No');
  
  if (!token) {
    console.log('10. No token, redirecting to WhosWiFi login');
    res.redirect('https://whoswifi.com/login');
  } else {
    try {
      console.log('11. Attempting to verify token');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('12. Token verified, redirecting to game');
      res.redirect('/game');
    } catch (err) {
      console.log('13. Token verification failed:', err.message);
      res.redirect('https://whoswifi.com/login');
    }
  }
});

// Serve game page (protected route)
app.get('/game', verifyToken, function (req, res) {
  console.log('14. Serving game page for user:', req.username);
  fs.readFile('index.html', 'utf8', function (err, data) {
    if (err) {
      console.log('15. Error reading index.html:', err);
      return res.status(500).send('Error loading game');
    }
    
    // Replace placeholder with actual username
    const modifiedData = data.replace('{{username}}', req.username);
    
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(modifiedData);
    return res.end();
  });
});

// Get tiers endpoint
app.get('/get_tiers', verifyToken, (req, res) => {
  console.log('\n=== GET TIERS ENDPOINT ===');
  console.log('User:', req.username);
  
  const query = 'SELECT collected_tiers FROM user_data WHERE username = ?';
  const params = [req.username];
  
  console.log('Executing SQL:', query);
  console.log('With params:', params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch collected tiers' });
    }

    if (results.length > 0) {
      console.log('✅ Found existing tiers:', results[0].collected_tiers);
      const tiers = results[0].collected_tiers ? results[0].collected_tiers.split(',') : [];
      return res.json({ success: true, tiers });
    } else {
      console.log('⚠️ User not found, creating new entry');
      const createQuery = 'INSERT INTO user_data (username, collected_tiers, color, achievements) VALUES (?, ?, ?, ?)';
      const createParams = [req.username, '', 'white', '{}'];
      
      console.log('Executing SQL:', createQuery);
      console.log('With params:', createParams);

      db.query(createQuery, createParams, (err) => {
        if (err) {
          console.error('❌ Error creating user:', err);
          return res.status(500).json({ success: false, message: 'Failed to create user data' });
        }
        console.log('✅ New user created successfully');
        return res.json({ success: true, tiers: [] });
      });
    }
  });
});

// Update tiers endpoint
app.post('/update_tiers', verifyToken, (req, res) => {
  console.log('\n=== UPDATE TIERS ENDPOINT ===');
  const { tier } = req.body;
  console.log('User:', req.username);
  console.log('New tier:', tier);

  const fetchQuery = 'SELECT collected_tiers FROM user_data WHERE username = ?';
  const fetchParams = [req.username];

  console.log('Executing SQL:', fetchQuery);
  console.log('With params:', fetchParams);

  db.query(fetchQuery, fetchParams, (err, results) => {
    if (err || results.length === 0) {
      console.error('❌ Error fetching current tiers:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }

    let collectedTiers = results[0].collected_tiers ? results[0].collected_tiers.split(',') : [];
    console.log('Current tiers:', collectedTiers);
    
    if (!collectedTiers.includes(tier)) {
      collectedTiers.push(tier);
      console.log('Added new tier. Updated tiers:', collectedTiers);
    }

    const updatedTiers = collectedTiers.join(',');
    const updateQuery = 'UPDATE user_data SET collected_tiers = ? WHERE username = ?';
    const updateParams = [updatedTiers, req.username];
    
    console.log('Executing SQL:', updateQuery);
    console.log('With params:', updateParams);

    db.query(updateQuery, updateParams, (err) => {
      if (err) {
        console.error('❌ Error updating tiers:', err);
        return res.status(500).json({ success: false, message: 'Failed to update tiers' });
      }
      console.log('✅ Tiers updated successfully');
      res.json({ success: true, message: 'Tiers updated successfully', tiers: collectedTiers });
    });
  });
});

// Update color endpoint
app.post('/update_color', verifyToken, (req, res) => {
  console.log('\n=== UPDATE COLOR ENDPOINT ===');
  const { color } = req.body;
  console.log('User:', req.username);
  console.log('New color:', color);

  const query = 'UPDATE user_data SET color = ? WHERE username = ?';
  const params = [color, req.username];
  
  console.log('Executing SQL:', query);
  console.log('With params:', params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Error updating color:', err);
      return res.json({ success: false, message: 'Failed to update color' });
    }
    console.log('✅ Color updated successfully');
    res.json({ success: true, message: 'Color updated successfully' });
  });
});

// Retrieve user's progress and data
app.get('/game', (req, res) => {
  const { username } = req.query;

  const query = 'SELECT * FROM user_data WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(404).send('User not found');

    const user = results[0];
    const userData = {
      color: user.color,
      tier_progress: JSON.parse(user.tier_progress),
      achievements: JSON.parse(user.achievements),
    };

    res.json({ success: true, userData });
  });
});

// Endpoint to update user's progress (color, collected_tiers, achievements)
app.post('/update-progress', (req, res) => {
  const { username, color, collected_tiers, achievements } = req.body;

  // Convert arrays/objects to strings if they aren't already
  const tiersString = Array.isArray(collected_tiers) ? collected_tiers.join(',') : collected_tiers;
  const achievementsJSON = typeof achievements === 'object' ? 
    JSON.stringify(achievements) : achievements;

  const query = `
    UPDATE user_data 
    SET color = ?, 
        collected_tiers = ?, 
        achievements = ?
    WHERE username = ?`;

  db.query(query, [color, tiersString, achievementsJSON, username], (err, results) => {
    if (err) {
      console.error('Update error:', err);
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

// Update achievements endpoint
app.post('/update_achievements', verifyToken, (req, res) => {
  console.log('\n=== UPDATE ACHIEVEMENTS ENDPOINT ===');
  const { achievements } = req.body;
  console.log('User:', req.username);
  console.log('New achievements:', achievements);

  const query = 'UPDATE user_data SET achievements = ? WHERE username = ?';
  const params = [JSON.stringify(achievements), req.username];

  console.log('Executing SQL:', query);
  console.log('With params:', params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Error updating achievements:', err);
      return res.json({ success: false, message: 'Failed to update achievements' });
    }
    console.log('✅ Achievements updated successfully');
    res.json({ success: true, message: 'Achievements updated successfully' });
  });
});

// Get achievements endpoint
app.get('/get_achievements', verifyToken, (req, res) => {
  console.log('\n=== GET ACHIEVEMENTS ENDPOINT ===');
  console.log('User:', req.username);

  const query = 'SELECT achievements FROM user_data WHERE username = ?';
  const params = [req.username];

  console.log('Executing SQL:', query);
  console.log('With params:', params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Error fetching achievements:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch achievements' });
    }

    if (results.length > 0) {
      console.log('✅ Found achievements:', results[0].achievements);
      const achievements = results[0].achievements ? JSON.parse(results[0].achievements) : {};
      return res.json({ success: true, achievements });
    } else {
      console.log('⚠️ No achievements found for user');
      return res.json({ success: false, message: 'User not found' });
    }
  });
});

// Add this endpoint to get initial user data
app.get('/get_user_data', verifyToken, (req, res) => {
  console.log('\n=== GET USER DATA ENDPOINT ===');
  console.log('User:', req.username);

  const query = 'SELECT color, collected_tiers, achievements FROM user_data WHERE username = ?';
  const params = [req.username];

  console.log('Executing SQL:', query);
  console.log('With params:', params);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Error fetching user data:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch user data' });
    }

    if (results.length > 0) {
      console.log('✅ Found user data:', results[0]);
      return res.json({ 
        success: true, 
        userData: results[0]
      });
    } else {
      console.log('⚠️ User not found, creating new entry');
      const createQuery = 'INSERT INTO user_data (username, collected_tiers, color, achievements) VALUES (?, ?, ?, ?)';
      const createParams = [req.username, '', 'white', '{}'];
      
      db.query(createQuery, createParams, (err) => {
        if (err) {
          console.error('❌ Error creating user:', err);
          return res.status(500).json({ success: false, message: 'Failed to create user data' });
        }
        console.log('✅ New user created successfully');
        return res.json({ 
          success: true, 
          userData: { color: 'white', collected_tiers: '', achievements: '{}' } 
        });
      });
    }
  });
});

app.listen(3123, function () {
  console.log('Chance is being hosted at http://localhost:3123');
});