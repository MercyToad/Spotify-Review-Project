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
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use(bodyParser.urlencoded({ extended: true }));


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
  bodyParser.urlencoded({
    extended: true,
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

app.use(
  express.static(path.join(__dirname, 'resourses'))
);

// Home route — make root go to /home
app.get('/', (req, res) => {
  res.redirect('/home');
});

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
app.get('/home', (req, res) => {
  const username = req.session && req.session.user ? req.session.user.username : null;
  return res.render('pages/home', {
    layout: 'main',
    username: username,
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.redirect('/login');
  });
});

// starting the server and keeping the connection open to listen for more requests
// server?

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');