const express = require("express");
const {
	googleLogin,
	googleSignup,
} = require("../../controllers/auth/googleAuth");

const router = express.Router();

router.post("/googleLogin", googleLogin);

router.post("/googleSignup", googleSignup);

module.exports = {
	route: router,
};
