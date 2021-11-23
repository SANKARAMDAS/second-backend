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
				clientEmail: "sanchi.shirur4@gmail.com",
				ETH: 10,
				BTC: 50,
				TRX: 40,
				item: [
					{
						description: "Product Description 1",
						qty: 5,
						unitPrice: 80,
					},
				],
				memo: "Some general description",
			})
			.expect(200)
			.end(function (err, res) {
				done(err);
			});
	});
});
