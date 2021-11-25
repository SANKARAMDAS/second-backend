const express = require("express");
const {
	createAccount,
} = require("../../controllers/stripe/freelancerAccountCreation");

const router = express.Router();

router.post("/createAccount", createAccount);

module.exports = {
	route: router,
};
