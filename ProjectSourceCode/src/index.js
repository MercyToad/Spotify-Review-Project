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

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


  // -------- Endpoints ------------- //

  /* VERY IMPORTANT NOTE: I WILL MAKE THESE ENDPOINTS WORK LATER I JSUT WANTED TO GET THEM DONE SO I CAN WORK ON OTHER HW*/

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});


//Register page
app.get('/', (req,res) => {
    res.redirect('/register');
})

app.get('/register', (req, res) => {
  res.render('pages/register.hbs');
});

app.post('/register', async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.render('pages/register.hbs', {
      message: "Must enter username and password",
      error: true,
    }); 
  }
  const hash = await bcrypt.hash(req.body.password, 10);
  try {
    await db.none(
    'INSERT INTO users (username, password) VALUES ($1, $2)',
    [req.body.username, hash]
    );  res.redirect('/login');//to-do:reroute to main page (currently reroutes to login page)
  }
  catch (err) {
    console.log(err);
    res.status(400).json({
      error: err,
    });
  }
});


//login page
app.get('/login', (req, res) => {
  res.render('pages/login.hbs');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      message: 'Must enter username and password',
      error: true
    });
  }


  try {
    // Secure, parameterized query
    const user = await db.oneOrNone(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    // User not found
    if (!user) {
      return res.render('pages/login.hbs', {
        message: 'User not found. Please register first.',
        error: true,
      });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('pages/login.hbs', {
        message: 'Password is incorrect.',
        error: true,
      });
    }

    // You can set session info here if you wish:
    // req.session.user = { id: user.user_id, username: user.username };

    console.log(`✅ User '${username}' logged in successfully.`);
    return res.redirect('/home'); // or whatever the home page 

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).render('pages/login.hbs', {
      message: 'Internal server error. Please try again later.',
      error: true,
    });
  }
});


//home page
app.get('/home', (req, res) => res.status(200).send('Welcome home'));

// server?

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');

/*
if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => console.log('Server is listening on port 3000'));
}

module.exports = app;
*/