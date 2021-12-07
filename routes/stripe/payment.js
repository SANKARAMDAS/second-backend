const express = require("express");
const { checkoutSession } = require("../../controllers/stripe/payment");

const router = express.Router();

router.post("/checkoutSession", checkoutSession);

module.exports = {
	route: router,
};
