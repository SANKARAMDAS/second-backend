const express = require("express");
const {
	invoiceCreation,
	getInvoiceInfo,
	getInvoices,
	updateInvoiceStatus,
	updateInvoiceParticulars,
	getPreviousInvoiceProportions,
} = require("../controllers/invoice");

const { auth } = require("../middlewares/auth");
const router = express.Router();

//Add member to mailing list
router.post("/invoiceCreation", invoiceCreation);

router.post("/getInvoiceInfo", getInvoiceInfo);

router.post("/getInvoices", getInvoices);

router.post("/updateInvoiceStatus", updateInvoiceStatus);

router.post("/updateInvoiceParticulars", updateInvoiceParticulars);

router.post("/getPreviousInvoiceProportions", getPreviousInvoiceProportions);

module.exports = {
	route: router,
};
