const express = require("express");
const { invoiceCreation } = require("../controllers/invoice");

const router = express.Router();

//Add member to mailing list
router.post("/invoiceCreation", invoiceCreation);

module.exports = {
	route: router,
};
