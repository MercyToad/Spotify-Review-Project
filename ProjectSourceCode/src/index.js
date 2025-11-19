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

// Home route
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/welcome', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Welcome!' });
});

// Login Page
app.get('/login', (req, res) => {
  res.render('pages/login', { layout: 'auth' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query using the correct column names from create.sql
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      return res.render('pages/login', {
        layout: 'auth',
        error: 'Username not found. Please register.'
      });
    }

    // Compare password with the password from database
    if (await bcrypt.compare(password, user.password_hash)) {
      req.session.user = { 
        id: user.user_id,  // Using user_id from create.sql
        username: user.username 
      };
      req.session.save();
      return res.redirect('/home');
    } else {
      return res.render('pages/login', {
        layout: 'auth',
        error: 'Incorrect password.'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', {
      layout: 'auth',
      error: 'An error occurred during login.'
    });
  }
});

// Register Page GET
app.get('/register', (req, res) => {
  res.render('pages/register', { layout: 'auth' });
});

// Register Page POST
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if username already exists
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    
    if (existingUser) {
      return res.render('pages/register', {
        layout: 'auth',
        error: 'Username already exists. Please choose another.'
      });
    }
    //hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Insert new user into database
    await db.none('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    
    // Redirect to login page after successful registration
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('pages/register', {
      layout: 'auth',
      error: 'An error occurred during registration. Please try again.'
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

// Home Page (protected)
app.get('/home', auth, (req, res) => {
  res.render('pages/home', { 
    layout: 'main',
    username: req.session.user.username 
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

// ============================
// REVIEW ROUTES
// ============================

// View all reviews for a target
app.get('/reviews/:target_type/:target_id', auth, async (req, res) => {
  const { target_type, target_id } = req.params;
  
  try {
    const reviews = await db.any(
      `SELECT r.*, u.username 
       FROM review r 
       JOIN users u ON r.user_id = u.user_id 
       WHERE r.target_type = $1 AND r.target_id = $2 
       ORDER BY r.created_at DESC`,
      [target_type, target_id]
    );
    
    res.render('pages/reviews', { reviews, target_type, target_id });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).send('Error loading reviews');
  }
});

// Create review form
app.get('/review/create/:target_type/:target_id', auth, (req, res) => {
  const { target_type, target_id } = req.params;
  res.render('pages/create_review', { target_type, target_id });
});

// Submit new review
app.post('/review/create', auth, async (req, res) => {
  const { target_type, target_id, title, review_text, rating } = req.body;
  const user_id = req.session.user.id;
  
  try {
    await db.none(
      `INSERT INTO review (user_id, target_type, target_id, title, review_text, rating) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user_id, target_type, target_id, title, review_text, rating]
    );
    res.redirect(`/reviews/${target_type}/${target_id}`);
  } catch (error) {
    console.error('Error creating review:', error);
    res.render('pages/create_review', {
      target_type, target_id,
      error: 'Failed to create review. You may have already reviewed this item.'
    });
  }
});

// Edit review form
app.get('/review/edit/:review_id', auth, async (req, res) => {
  const { review_id } = req.params;
  const user_id = req.session.user.id;
  
  try {
    const review = await db.oneOrNone(
      'SELECT * FROM review WHERE review_id = $1 AND user_id = $2',
      [review_id, user_id]
    );
    
    if (!review) {
      return res.status(404).send('Review not found');
    }
    
    res.render('pages/edit_review', { review });
  } catch (error) {
    console.error('Error loading review:', error);
    res.status(500).send('Error loading review');
  }
});

// Update review
app.post('/review/edit/:review_id', auth, async (req, res) => {
  const { review_id } = req.params;
  const { title, review_text, rating } = req.body;
  const user_id = req.session.user.id;
  
  try {
    const result = await db.result(
      `UPDATE review 
       SET title = $1, review_text = $2, rating = $3, updated_at = NOW() 
       WHERE review_id = $4 AND user_id = $5`,
      [title, review_text, rating, review_id, user_id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).send('Review not found');
    }
    
    const review = await db.one('SELECT target_type, target_id FROM review WHERE review_id = $1', [review_id]);
    res.redirect(`/reviews/${review.target_type}/${review.target_id}`);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).send('Error updating review');
  }
});

// Delete review
app.post('/review/delete/:review_id', auth, async (req, res) => {
  const { review_id } = req.params;
  const user_id = req.session.user.id;
  
  try {
    const review = await db.oneOrNone(
      'SELECT target_type, target_id FROM review WHERE review_id = $1 AND user_id = $2',
      [review_id, user_id]
    );
    
    if (!review) {
      return res.status(404).send('Review not found');
    }
    
    await db.none('DELETE FROM review WHERE review_id = $1 AND user_id = $2', [review_id, user_id]);
    res.redirect(`/reviews/${review.target_type}/${review.target_id}`);
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).send('Error deleting review');
  }
});

// View user's own reviews
app.get('/my-reviews', auth, async (req, res) => {
  const user_id = req.session.user.id;
  
  try {
    const reviews = await db.any(
      `SELECT * FROM review 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id]
    );
    
    res.render('pages/my_reviews', { reviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).send('Error loading your reviews');
  }
});


// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');