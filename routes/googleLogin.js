const express = require("express");
const { googleLogin, googleSignup } = require("../controllers/auth");

const router = express.Router();

router.post("/googleLogin", googleLogin);

router.post("/googleSignup", googleSignup);

module.exports = {
	route: router,
};
