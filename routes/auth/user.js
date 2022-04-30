const express = require("express");
const { auth } = require("../../middlewares/auth");
const { upload } = require("../../middlewares/upload")
const { uploadKyb } = require("../../middlewares/kyb")
const { checkstatus } = require("../../middlewares/checkStatus")
const router = express.Router();
const {
	// sendOtp,
	emailVerify,
	resendEmail,
	signup,
	signin,
	// verifyOtp,
	getUserProfile,
	refresh,
	validate2fa,
	forgotPassword,
	passwordReset,
	updateProfile,
	uploadDocument,
	getUser,
	logout,
	completeKyb
} = require("../../controllers/auth/user");




// router.post("/emailverification", sendOtp);

// router.post("/verifyOtp", verifyOtp);

router.post("/verifyEmail", emailVerify)

router.post("/resendEmail", resendEmail)

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/refresh", refresh);

router.post("/getuser", getUser);

router.post("/forgotpassword", forgotPassword);

router.post("/validate2fa", validate2fa)

router.post("/passwordreset", passwordReset);

router.post("/getUserProfile", auth, getUserProfile);

router.post("/updateProfile", updateProfile);

router.post("/upload", auth, checkstatus, upload.single("document"), uploadDocument);

router.post("/completeKyb", auth, checkstatus, uploadKyb.array("documents", 2), completeKyb);

router.post("/logout", logout);

module.exports = {
	route: router,
};
