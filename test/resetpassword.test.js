var supertest = require('supertest');
var chai = require('chai');
var app = require('../server.js');
const User = require('../models/user')

global.app = app;
global.expect = chai.expect;
global.request = supertest(app);

describe('POST /forgotPassword', function () {
    it('generates a link to reset password', function (done) {
        request.post('/api/auth/forgotPassword')
            .send({
                email: "jmcnally2978@gmail.com",
            })
            .expect(200)
            .end(function (err, res) {
                done(err);
            });
    });
});

// describe('POST /passwordreset', function () {
//     it('verfies the generated link', async function (done) {

//         const user = await User.findOne({ email: "test1@gmail.com" })
//         console.log(user)

//         const userID = user._id.toString()

//         console.log(userID)
//         console.log(user.resetToken)

//         request.post('/api/auth/passwordreset')
//             .send({
//                 id: userID,
//                 token: user.resetToken,
//                 password: 'test123',
//                 password2: 'test123'
//             })
//             .expect(200)
//             .end(function (err, res) {
//                 done(err);
//             });
//     })
// })