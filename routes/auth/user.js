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
	logout,
} = require("../../controllers/auth/user");

router.post("/emailverification", sendOtp);

router.post("/verifyOtp", verifyOtp);

router.post("/signup", signup);

router.post("/signin", signin);

router.get("/refresh", refresh);

router.post("/forgotpassword", forgotPassword);

router.post("/passwordreset", passwordReset);

router.post("/getUserProfile", getUserProfile);

router.post("/updateProfile", updateProfile);

router.post("/logout", auth, logout);

module.exports = {
	route: router,
};
