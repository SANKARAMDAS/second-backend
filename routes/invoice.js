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
router.post("/invoiceCreation", auth, invoiceCreation);

router.post("/getInvoiceInfo", auth, getInvoiceInfo);

router.post("/getInvoices", auth, getInvoices);

router.post("/updateInvoiceStatus", auth, updateInvoiceStatus);

router.post("/updateInvoiceParticulars", auth, updateInvoiceParticulars);

router.post("/getPreviousInvoiceProportions", auth, getPreviousInvoiceProportions);

module.exports = {
	route: router,
};
