const express = require("express");
const { auth } = require("../../middlewares/auth");
const router = express.Router();
const {
	sendOtp,
	signup,
	signin,
	verifyOtp,
	refresh,
	forgotPassword,
	passwordReset,
	updateProfile,
	logout,
} = require("../../controllers/auth/user");

router.post("/emailverification", sendOtp);

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/verifyOtp", verifyOtp);

router.get("/refresh", refresh);

router.post("/forgotpassword", forgotPassword);

router.post("/passwordreset", passwordReset);

router.post("/updateProfile", updateProfile);

router.post("/logout", auth, logout);

module.exports = {
	route: router,
};
