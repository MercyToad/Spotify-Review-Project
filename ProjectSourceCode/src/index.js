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
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

//- ****** ADDED: SERVER CONFIGURATION ****** -//
// Register `hbs` as the view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Setup body-parser
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Setup express.static to serve resources
// We should fix the typo here ...
app.use(express.static(path.join(__dirname, 'resourses')));

// Setup session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecretkey', // CHANGE THIS!
    saveUninitialized: false,
    resave: false,
  })
);
//- ****** END OF ADDED SERVER CONFIGURATION ****** -//


// database configuration
const dbConfig = {
  host: 'db', // the database server
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


//- ****** ADDED: NEW ROUTES ****** -//
app.get('/', (req, res) => {
  res.redirect('/home'); // Redirect root to home page
});

app.get('/home', (req, res) => {
  res.render('pages/home'); 
});
//- ****** END OF ADDED NEW ROUTES ****** -//


//- ****** UNCOMMENTED FROM LAB 7 ****** -//
// (un-commented) 

// Login Page
app.get('/login', (req, res) => {
  res.render('pages/login'); // Removed layout: 'main', it's default
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]); // Searches db if the username exists

    if (!user) {
      // User not found
      return res.status(401).render('pages/login', {
        error: "User not found. Please register.",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      req.session.user = { id: user.id, username: user.username };
      // Redirect to /home instead of /discover
      return res.redirect('/home');
    } else {
      // Incorrect password
      return res.status(401).render('pages/login', {
        error: "Incorrect password.",
      });
    }
  } catch (error) {
    console.error(error);
    res.render('pages/login', { error: 'An error occurred.' });
  }
});

// Registration Page
app.get('/register', (req, res) => {
  res.render('pages/register'); // Removed layout: 'main'
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.none('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.redirect('/register');
  }
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
// Any routes *below* this line will require a user to be logged in.

// Discover Page
const API_KEY = process.env.API_KEY;

app.get('/discover', auth, async (req, res) => {
  const keyword = 'music'; // Can be changed
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&keyword=${keyword}&size=12`;// change size here for more options

  try {
    const response = await axios.get(url);
    const events = response.data._embedded?.events || [];
    res.render('pages/discover', { results: events });
  } catch (error) {
    console.error('API error:', error.message);
    res.render('pages/discover', { results: [], error: 'Could not load events.' });
  }
});

// Logout Page
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    // Render a logout page, or just redirect to login
    res.redirect('/login');
  });
});
//- ****** END OF UNCOMMENTED BLOCK ****** -//


// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');