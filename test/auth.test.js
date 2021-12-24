var supertest = require("supertest");
var chai = require("chai");
var app = require("../server.js");
const Business = require("../models/business");
const Freelancer = require("../models/freelancer");

global.app = app;
global.expect = chai.expect;
global.request = supertest(app);

describe("db", () => {
	//empty the database
	beforeEach((done) => {
		Business.deleteMany({}, (err) => {
			Freelancer.deleteMany({}, (err) => {
				done();
			});
		});
	});

	// SignUp test --- 1
	describe("POST /signup", function () {
		it("On email verification it creates an account", function (done) {
			request
				.post("/api/auth/emailverification")
				.send({
					name: "Tarang",
					email: "tarang.padia2@gmail.com",
					password: "test@123",
				})
				.expect(200)
				.end(function (err, res) {
					const result = JSON.parse(res.text);
					console.log("Result", result);
					request
						.post("/api/auth/verifyOtp")
						.send({
							name: result.data.name,
							email: result.data.email,
							password: result.data.password,
							otp: result.data.otp,
							hash: result.data.hash,
						})
						.expect(200)
						.end(function (err, res) {
							request
								.post("/api/auth/signup")
								.send({
									name: "Tarang",
									password: "test@123",
									email: "tarang.padia2@gmail.com",
									role: "freelancer",
								})
								.expect(200)
								.end(function (err, res) {
									done(err);
								});
						});
				});
		});
	});

	// SignIn test --- 2
	describe("POST /signin", function () {
		it("Sign In Freelancer/Business", function (done) {
			request
				.post("/api/auth/signup")
				.send({
					name: "Tarang",
					password: "test@123",
					email: "tarang.padia2@gmail.com",
					role: "freelancer",
				})
				.expect(200)
				.end(function (err, res) {
					request
						.post("/api/auth/signin")
						.send({
							email: "tarang.padia2@gmail.com",
							password: "test@123",
						})
						.expect(202)
						.end(function (err, res) {
							const result = JSON.parse(res.text);
							console.log(result);
							done(err);
						});
				});
		});
	});
});

// GoogleLogin and Sign up  --> ID changes every time hence it is commented

// describe("POST /googleSignUp and /googleLogin", function () {
// 	it("Sign In Freelancer/Business", function (done) {
// 		request
// 			.post("/api/google-api/verifyEmailGoogleAuth")
// 			.send({
// 				tokenId:
// 					"eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxODkyZWI0OWQ3ZWY5YWRmOGIyZTE0YzA1Y2EwZDAzMjcxNGEyMzciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMzY1ODIxNjI0NzI1LWtlODlhYzVtY2trcnBnM251NzZjZWluMnZyc3MzM3RnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMzY1ODIxNjI0NzI1LWtlODlhYzVtY2trcnBnM251NzZjZWluMnZyc3MzM3RnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA0NDIzNzA3MjQ3NzcxNDMwNzEyIiwiaGQiOiJvY3RhbG9vcC5jb20iLCJlbWFpbCI6InNhbmNoaXRhQG9jdGFsb29wLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiZUpNSFpjWm9PT0xFa0dtV2hHdjUzQSIsIm5hbWUiOiJTYW5jaGl0YSBTaGlydXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKeG9wWnNwTEFrQ29BMEk3c3V6UjRhSFFFN2Y0NTE2VTFFR3d3aHI9czk2LWMiLCJnaXZlbl9uYW1lIjoiU2FuY2hpdGEgIiwiZmFtaWx5X25hbWUiOiJTaGlydXIiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYzOTU2NDU2MSwiZXhwIjoxNjM5NTY4MTYxLCJqdGkiOiI4N2U0YzU4YTZhODA2YWM2MTg1YTRiZGNhMjVhNDQyODA5YmNkYWQ0In0.DDxeiauATHkyrnYtA3ykYTlnptZTFnOCWvXqW6mJWbD1JrPRyaZTl5V7yrnFGaCwj5x2bF91Tm6wTVGOHbtyvYp3B-A_ePiFDeHQLwaM-CMEiSSYpa_nQYLYsZmJnAmt6KGpus45KAVnD0zCNqjW1jJsjjeve7-E2CdiTIfeksbk6NM5vNIzaeKZWW-JtSWC_iy60TaIgJBo_2ABD7EJRZ8r7T9SF8IvLhpqRm5UPOMNRhCAo3sVr7szQUUOuqYl2c2eXnHioT4sfjV7roHGK-H0M9pQqT1bHPKVJMXB3CkybdAdXCYuN7WXJSs3Jxf_n3XaPSS0VRjfRolj8U4aHA",
// 			})
// 			.expect(200)
// 			.end(function (err, res) {
// 				request
// 					.post("/api/google-api/googleSignup")
// 					.send({
// 						email: "sanchi.shirur4@gmail.com",
// 						name: "Sanchita Shirur",
// 					})
// 					.expect(202)
// 					.end(function (err, res) {
// 						request
// 							.post("/api/google-api/googleLogin")
// 							.send({
// 								tokenId:
// 									"eyJhbGciOiJSUzI1NiIsImtpZCI6ImMxODkyZWI0OWQ3ZWY5YWRmOGIyZTE0YzA1Y2EwZDAzMjcxNGEyMzciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMzY1ODIxNjI0NzI1LWtlODlhYzVtY2trcnBnM251NzZjZWluMnZyc3MzM3RnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMzY1ODIxNjI0NzI1LWtlODlhYzVtY2trcnBnM251NzZjZWluMnZyc3MzM3RnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA0NDIzNzA3MjQ3NzcxNDMwNzEyIiwiaGQiOiJvY3RhbG9vcC5jb20iLCJlbWFpbCI6InNhbmNoaXRhQG9jdGFsb29wLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiZUpNSFpjWm9PT0xFa0dtV2hHdjUzQSIsIm5hbWUiOiJTYW5jaGl0YSBTaGlydXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKeG9wWnNwTEFrQ29BMEk3c3V6UjRhSFFFN2Y0NTE2VTFFR3d3aHI9czk2LWMiLCJnaXZlbl9uYW1lIjoiU2FuY2hpdGEgIiwiZmFtaWx5X25hbWUiOiJTaGlydXIiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYzOTU2NDU2MSwiZXhwIjoxNjM5NTY4MTYxLCJqdGkiOiI4N2U0YzU4YTZhODA2YWM2MTg1YTRiZGNhMjVhNDQyODA5YmNkYWQ0In0.DDxeiauATHkyrnYtA3ykYTlnptZTFnOCWvXqW6mJWbD1JrPRyaZTl5V7yrnFGaCwj5x2bF91Tm6wTVGOHbtyvYp3B-A_ePiFDeHQLwaM-CMEiSSYpa_nQYLYsZmJnAmt6KGpus45KAVnD0zCNqjW1jJsjjeve7-E2CdiTIfeksbk6NM5vNIzaeKZWW-JtSWC_iy60TaIgJBo_2ABD7EJRZ8r7T9SF8IvLhpqRm5UPOMNRhCAo3sVr7szQUUOuqYl2c2eXnHioT4sfjV7roHGK-H0M9pQqT1bHPKVJMXB3CkybdAdXCYuN7WXJSs3Jxf_n3XaPSS0VRjfRolj8U4aHA",
// 							})
// 							.expect(202)
// 							.end(function (err, res) {
// 								const result = JSON.parse(res.text);
// 								console.log(result);
// 								done(err);
// 							});
// 					});
// 			});
// 	});
// });

// Forgot and Reset Password
describe("POST /forgotPassword and /reset Password", function () {
	it("generates a link to reset password and updates the password", function (done) {
		request
			.post("/api/auth/forgotPassword")
			.send({
				user_email: "tarang.padia2@gmail.com",
			})
			.expect(200)
			.end(function (err, res) {
				const result = JSON.parse(res.text);
				console.log(result);
				request
					.post("/api/auth/passwordreset")
					.send({
						email: result.data.email,
						password: "newPassword",
					})
					.expect(200)
					.end(function (err, res) {
						done(err);
					});
			});
	});
});

// Update profile
describe("POST /updateProfile", function () {
	it("generates a link to reset password and updates the password", function (done) {
		request
			.post("/api/auth/updateProfile")
			.send({
				email: "tarang.padia2@gmail.com",
				address: "1775 Rosemont Avenue",
				city: "Maitland",
				state: "Florida",
				country: "United States",
				zipCode: 32751,
				taxId: "hjkdghhoru8495093",
			})
			.expect(200)
			.end(function (err, res) {
				done(err);
			});
	});
});

// get profile
// Update profile
describe("POST /getuserProfile", function () {
	it("Returns user information based on email", function (done) {
		request
			.post("/api/auth/getuserProfile")
			.send({
				email: "tarang.padia2@gmail.com",
			})
			.expect(200)
			.end(function (err, res) {
				done(err);
			});
	});
});
