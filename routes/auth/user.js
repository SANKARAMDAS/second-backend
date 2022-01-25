const express = require("express");
const { auth } = require("../../middlewares/auth");
const router = express.Router();
const {
	sendOtp,
	signup,
	signin,
	verifyOtp,
	getUserProfile,
	refresh,
	forgotPassword,
	passwordReset,
	updateProfile,
	getUser,
	logout,
} = require("../../controllers/auth/user");

router.post("/emailverification", sendOtp);

router.post("/verifyOtp", verifyOtp);

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/refresh", refresh);

router.post("/getuser", getUser);

router.post("/forgotpassword", forgotPassword);

router.post("/passwordreset", passwordReset);

router.post("/getUserProfile", getUserProfile);

router.post("/updateProfile", updateProfile);

router.post("/logout", logout);

module.exports = {
	route: router,
};
