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

// ********************************************************************************