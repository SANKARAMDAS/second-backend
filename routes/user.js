const express = require("express");
const { auth } = require('../middlewares/auth')
const router = express.Router();
const {
	signup,
	signin,
	forgotPassword,
	passwordReset,
	sendOtp,
	generateAccessToken,
	logout
} = require("../controllers/user");

const { sendEmail } = require("../controllers/sendEmail");

router.post("/emailverification", sendOtp);

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/sendemail", sendEmail);

router.post("/refreshToken", generateAccessToken)

router.post("/logout", auth, logout)

router.post("/forgotpassword", forgotPassword);

router.post("/passwordreset", passwordReset);

module.exports = router;
