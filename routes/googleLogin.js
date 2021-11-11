const express = require("express");
const { googleLogin } = require("../controllers/auth");

const router = express.Router();

//Add member to mailing list
router.post("/googleLogin", googleLogin);

module.exports = {
	route: router,
};
