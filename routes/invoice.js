const express = require("express");
const { invoiceCreation, getInvoiceInfo } = require("../controllers/invoice");

const router = express.Router();

//Add member to mailing list
router.post("/invoiceCreation", invoiceCreation);

router.post("/getInvoiceInfo", getInvoiceInfo);

module.exports = {
	route: router,
};
