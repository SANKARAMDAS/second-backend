const express = require("express");
const {
	getWallet,
	createWallet,
	getFreelancerBalance,
} = require("../../controllers/wyre/general");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.get("/getWallet", auth, getWallet);
router.post("/createWallet", auth, createWallet);
router.post("/getFreelancerBalance", auth, getFreelancerBalance);

module.exports = router;
