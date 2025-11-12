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
*/


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