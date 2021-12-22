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
						qty: 5,
						unitPrice: 80,
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

// Get Invoices
describe("POST /updateInvoiceStatus", function () {
	it("Update invoice status", function (done) {
		request
			.post("/api/invoice/updateInvoiceStatus")
			.send({
				email: "sanchi.shirur4@gmail.com",
				name: "Sanchita",
				invoiceId: "0139c439-5e89-4049-ab63-5b3de1afe0a3",
				status: "cancel", // cancel resolved paid pending
			})
			.expect(200)
			.end(function (err, res) {
				done(err);
			});
	});
});
