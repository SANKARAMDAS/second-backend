var supertest = require("supertest");
var chai = require("chai");
var app = require("../server.js");

global.app = app;
global.expect = chai.expect;
global.request = supertest(app);

describe("POST /invoiceCreation", function () {
	it("sends invoice email", function (done) {
		request
			.post("/api/invoice/invoiceCreation")
			.send({
				freelancerEmail: "tarang.padia2@gmail.com",
				businessEmail: "sanchi.shirur4@gmail.com",
				freelancerName: "Tarang",
				businessName: "Sanchita",
				ETH: 10,
				BTC: 50,
				FIAT: 40,
				item: [
					{
						description: "Product Description 1",
						quantity: 5,
						price: 80,
					},
				],
				memo: "Some general description",
				dueDate: "5/12/2021",
				creationDate: "30/11/2021",
			})
			.expect(200)
			.end(function (err, res) {
				done(err);
			});
	});
});

// Get Invoices
describe("POST /getInvoices", function () {
	it("Get user invoices", function (done) {
		request
			.post("/api/invoice/getInvoices")
			.send({
				email: "tarang.padia2@gmail.com",
				role: "freelancer",
			})
			.expect(200)
			.end(function (err, res) {
				done(err);
			});
	});
});
