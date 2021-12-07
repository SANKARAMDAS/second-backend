var supertest = require('supertest');
var chai = require('chai');
var app = require('../server.js');
const User = require('../models/user')

global.app = app;
global.expect = chai.expect;
global.request = supertest(app);


describe('db', () => {
	beforeEach((done) => { //empty the database
		User.remove({}, (err) => {
			done();
		});
	});

	// Sign up test
	describe('POST /emailverification', function () {
		it('sends an otp', function (done) {
			request.post('/api/auth/emailverification')
				.send({
					name: "test",
					email: "jmcnally2978@gmail.com",
					password: "test@123",
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
				});
		});
	});

	describe('POST /signin', function () {
		it('sign in', function (done) {
			request.post('/api/auth/emailverification')
				.send({
					name: "test",
					email: "jmcnally2978@gmail.com",
					password: "test@123",
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
							request.post('/api/auth/signin')
								.send({
									email: "jmcnally2978@gmail.com",
									password: "test@123"
								}).expect(200)
								.end(function (err, res) {
									done(err)
								})
						});
				});
		});
	});

});
