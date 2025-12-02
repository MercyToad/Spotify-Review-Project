//(FROM LAB 7)
//-------------Import dependencies--------------------//
const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

//(FROM LAB 7)
//-------------Connect to database--------------------//

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// database configuration
const dbConfig = {
  host: process.env.HOST, // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// Middleware
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// Initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

const bearer_token = `Bearer ${process.env.API_KEY}`;



app.use(
  express.static(path.join(__dirname, 'resourses'))
);

// Root route — serve public landing page
app.get('/', async (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : null;
  const query = 'SELECT spotify_id FROM songs ORDER BY average_rating DESC LIMIT 7'
    const song_ids = await db.any(query);
    songs = [];
    for (const i of song_ids) {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${i.spotify_id}`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': bearer_token,
      },
      });
      const data = await response.json();
      songs.push(data);
    }
    console.log(songs);
  return res.render('pages/public', { 
    layout: 'main',
    username,
    songs: songs
  });
});

// Minimal My Reviews route (no API, frontend-only reviews)
app.get('/my-reviews', (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : 'Guest';
  res.render('pages/my-reviews', { layout: 'main', username });
});

// Note: My Reviews page is served via the views; frontend handles review creation client-side.

app.get('/welcome', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Welcome!' });
});

// Login Page GET
app.get('/login', (req, res) => {
  res.render('pages/login', { layout: 'auth' });
});

// Login Page POST
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).render('pages/login', {
      layout: 'auth',
      error: 'Must enter username and password',
    });
  }

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      return res.status(401).render('pages/login', {
        layout: 'auth',
        error: 'Username not found. Please register.',
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).render('pages/login', {
        layout: 'auth',
        error: 'Incorrect password.',
      });
    }

    req.session.user = { id: user.user_id, username: user.username };
    req.session.save(() => {
      return res.redirect('/home');
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).render('pages/login', {
      layout: 'auth',
      error: 'An error occurred during login. Please try again.',
    });
  }
});

// Register Page GET
app.get('/register', (req, res) => {
  res.render('pages/register', { layout: 'auth' });
});

// Register Page POST
app.post('/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).render('pages/register', {
      layout: 'auth',
      error: 'Must enter username and password',
    });
  }

  try {
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser) {
      return res.status(409).render('pages/register', {
        layout: 'auth',
        error: 'Username already exists. Please choose another.',
      });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.none('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    return res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).render('pages/register', {
      layout: 'auth',
      error: 'An error occurred during registration. Please try again.',
    });
  }
});

// Authentication Middleware
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Home Page. If a user is logged in we pass the username, otherwise render public home.
app.get('/home', async (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : null;
  let songs;
  if (username) {
    const response = await fetch('https://api.spotify.com/v1/playlists/34NbomaTu7YuOYnky8nLXL/tracks?limit=3', { //hard coded top 50 playlist cuz i cant access official spotify one. unsure if this will ever change
    method: 'GET',
    headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': bearer_token,
    },
    });
    const data = await response.json();
    songs = data.items;
    console.log(songs);
  }
  else {
    const query = 'SELECT spotify_id FROM songs ORDER BY average_rating DESC LIMIT 7'
    const song_ids = await db.any(query);
    songs = [];
    for (const i of song_ids) {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${i.spotify_id}`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': bearer_token,
      },
      });
      const data = await response.json();
      songs.push(data);
    }
  }
  return res.render('pages/home', {
    layout: 'main',
    username: username,
    songs: songs,
  });
});

// Logout
app.get('/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    // After logout, send user to the public landing page
    res.redirect('/');
  });
});

app.get('/searchResults', async (req, res) => {
  const query = req.query.song_name;
  const params = new URLSearchParams({
    'q': query,
    'type': 'track',
    'limit': 5,
  });
  console.log(params);
  const response = fetch(`https://api.spotify.com/v1/search?${params}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': bearer_token,
  },
  // body: JSON.stringify(postData),
});
// .then(response => response.json())
// .then(data => console.log(data))
// .catch(error => console.error('Error:', error))
// .return


  // try {
  //   const response = await fetch(url);
  //   if (!response.ok) {
  //     throw new Error(`Network response was not ok: ${response.status}`);
  //   }

  //   // 3. Parse the response body as JSON
  //   const data = await response.json();

  //   // 4. Use the data
  //   console.log(data);
});

// starting the server and keeping the connection open to listen for more requests
// server?

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');