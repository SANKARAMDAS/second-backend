var supertest = require('supertest');
var chai = require('chai');
var app = require('../server.js');

global.app = app;
global.expect = chai.expect;
global.request = supertest(app);

// Sign up test
describe('POST /emailverification', function () {
    it('sends an otp', function (done) {
        request.post('/api/auth/emailverification')
            .send({
                name: "test",
                email: "jmcnally2978@gmail.com",
                password: "test@123",
                password2: "test@123",
            })
            .expect(200)
            .end(function (err, res) {
                const result = JSON.parse(res.text)
                console.log(result)
                done(err);
            });
    });
});


describe('POST /signup', function () {
    it('creates an account', function (done) {
        request.post('/api/auth/emailverification')
            .send({
                name: "test",
                email: "jmcnally2978@gmail.com",
                password: "test@123",
                password2: "test@123",
            })
            .expect(200)
            .end(function (err, res) {
                const result = JSON.parse(res.text)
                request.post('/api/auth/signup')
                    .send({
                        name: result.name,
                        email: result.email,
                        password: result.password,
                        otp: result.otp,
                        hash: result.hash
                    })
                    .expect(200)
                    .end(function (err, res) {
                        done(err);
                    });
                // done(err);
            });
    });
});

// describe('POST /signup', function () {
//     it('saves a new user', function (done) {
//         request.post('/auth/api/signup')
//             .send({
//                 name: "test",
//                 email: "test@gmail.com",
//                 password: "test@123",
//                 hash: 

//             })
//             .expect(200)
//             .end(function (err, res) {
//                 done(err);
//             });
//     });
// });

// describe('POST /signup', function () {
//     it('validation test', function (done) {
//         request.post('/auth/api/signup')
//             .send({
//                 name: "test",
//                 email: "test1@gmail.com",
//                 password: "tn",
//                 password2: "tn",
//                 role: "freelancer"
//             })
//             .expect(400)
//             .end(function (err, res) {
//                 done(err);
//             });
//     });
// });


// // User login test
// describe('POST /signin', function () {
//     it('sign in', function (done) {
//         request.post('/auth/api/signin')
//             .send({
//                 email: "test1@gmail.com",
//                 password: "tnt",
//             })
//             .expect(200)
//             .end(function (err, res) {
//                 done(err);
//             });
//     });
// });

// describe('POST /signin', function () {
//     it('auth test', function (done) {
//         request.post('/auth/api/signin')
//             .send({
//                 email: "test1@gmail.com",
//                 password: "tnt2",
//             })
//             .expect(400)
//             .end(function (err, res) {
//                 done(err);
//             });
//     });
// });