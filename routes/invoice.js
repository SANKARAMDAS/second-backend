const express = require("express");
const {
	invoiceCreation,
	getInvoiceInfo,
	getFreelancerInvoices,
} = require("../controllers/invoice");

const router = express.Router();

//Add member to mailing list
router.post("/invoiceCreation", invoiceCreation);

router.post("/getInvoiceInfo", getInvoiceInfo);

router.post("/getFreelancerInvoices", getFreelancerInvoices);

module.exports = {
	route: router,
};
