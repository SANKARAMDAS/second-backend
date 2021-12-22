const express = require("express");
const {
	invoiceCreation,
	getInvoiceInfo,
	getInvoices,
	updateInvoiceStatus,
} = require("../controllers/invoice");

const { auth } = require("../middlewares/auth");
const router = express.Router();

//Add member to mailing list
router.post("/invoiceCreation", invoiceCreation);

router.post("/getInvoiceInfo", getInvoiceInfo);

router.post("/getInvoices", getInvoices);

router.post("/updateInvoiceStatus", updateInvoiceStatus);

module.exports = {
	route: router,
};
