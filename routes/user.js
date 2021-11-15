const express = require("express");
const router = express.Router();
const {
	signup,
	signin,
	forgotPassword,
	passwordReset,
	sendOtp,
} = require("../controllers/user");

const { sendEmail } = require("../controllers/sendEmail");

router.post("/emailverification", sendOtp);

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/sendemail", sendEmail);

router.post("/forgotpassword", forgotPassword);

router.post("/passwordreset", passwordReset);

module.exports = router;
