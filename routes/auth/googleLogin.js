const express = require("express");
const {
	googleLogin,
	googleSignup,
	verifyEmailGoogleAuth,
} = require("../../controllers/auth/googleAuth");

const router = express.Router();

router.post("/verifyEmailGoogleAuth", verifyEmailGoogleAuth);

router.post("/googleLogin", googleLogin);

router.post("/googleSignup", googleSignup);

module.exports = {
	route: router,
};
