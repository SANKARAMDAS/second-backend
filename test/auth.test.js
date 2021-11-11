var supertest = require('supertest');
var chai = require('chai');
var app = require('../server.js');

global.app = app;
global.expect = chai.expect;
global.request = supertest(app);

// Sign up test
describe('POST /signup', function () {
    it('saves a new user', function (done) {
        request.post('/signup')
            .send({
                name: "test",
                email: "test1@gmail.com",
                password: "tnt",
                password2: "tnt",
                role: "freelancer"
            })
            .expect(200)
            .end(function (err, res) {
                done(err);
            });
    });
});

describe('POST /signup', function () {
    it('validation test', function (done) {
        request.post('/signup')
            .send({
                name: "test",
                email: "test1@gmail.com",
                password: "tn",
                password2: "tn",
                role: "freelancer"
            })
            .expect(400)
            .end(function (err, res) {
                done(err);
            });
    });
});


// User login test
describe('POST /signin', function () {
    it('sign in', function (done) {
        request.post('/signin')
            .send({
                email: "test1@gmail.com",
                password: "tnt",
            })
            .expect(200)
            .end(function (err, res) {
                done(err);
            });
    });
});

describe('POST /signin', function () {
    it('auth test', function (done) {
        request.post('/signin')
            .send({
                email: "test1@gmail.com",
                password: "tnt2",
            })
            .expect(400)
            .end(function (err, res) {
                done(err);
            });
    });
});