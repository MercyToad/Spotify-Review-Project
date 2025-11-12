// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request('http://localhost:3000')
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************







/*

// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
    console.log("I'm here!");
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
/*
describe('Testing Add User API', () => {
  it('positive : /add_user', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'jdoe', password: 'password'})
      .end((err, res) => {
        // expect(res.body.message).to.equals('User added successfully');
        if (err) {
          return done(err);
        }

        // 2. Handle assertion errors
        // Use try/catch so if 'expect' fails, we still call done()
        try {
          // Your assertions go here
          expect(res).to.have.status(201);
          // expect(res.body.message).to.equals('User added successfully');

          done(); // <-- Call done() only on success
        } catch (assertionError) {
          done(assertionError); // <-- Pass the assertion error to done()
        }
      });
  });
});



// Utility for random usernames (to avoid duplicates)
function randomUsername() {
  return 'user_' + Math.floor(Math.random() * 100000);
}

describe('User Authentication API', () => {
  
  it('should register a new user successfully', (done) => {
    const newUser = {
      username: randomUsername(),
      password: 'password123'
    };

    chai.request(server)
      .post('/register')
      .send(newUser)
      .end((err, res) => {
        if (err) return done(err);
        expect([200, 201]).to.include(res.status);
        done();
      });
  });

  it('should not register a user without username or password', (done) => {
    chai.request(server)
      .post('/register')
      .send({ username: '' })
      .end((err, res) => {
        expect(res).to.have.status(400);
        done();
      });
  });

  it('should login successfully with correct credentials', (done) => {
    const user = {
      username: randomUsername(),
      password: 'mypassword'
    };

    // Step 1: Register first
    chai.request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) return done(err);
        // Step 2: Then login
        chai.request(server)
          .post('/login')
          .send(user)
          .end((err2, res2) => {
            if (err2) return done(err2);
            expect(res2).to.have.status(200);
            done();
          });
      });
  });

  it('should fail login with wrong password', (done) => {
    const user = {
      username: randomUsername(),
      password: 'password1'
    };

    // Register first
    chai.request(server)
      .post('/register')
      .send(user)
      .end(() => {
        // Try wrong password
        chai.request(server)
          .post('/login')
          .send({ username: user.username, password: 'wrongpass' })
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.text).to.include('Password is incorrect');
            done();
          });
      });
  });
});
// ********************************************************************************






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

  /* VERY IMPORTANT NOTE: I WILL MAKE THESE ENDPOINTS WORK LATER I JSUT WANTED TO GET THEM DONE SO I CAN WORK ON OTHER HW

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


if (process.env.NODE_ENV !== 'test') {
  app.listen(3000, () => console.log('Server is listening on port 3000'));
}

module.exports = app;

*/