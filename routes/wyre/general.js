const express = require("express");
const {
	getWallet,
	createWallet,
	getFreelancerBalance,
} = require("../../controllers/wyre/general");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.get("/getWallet", getWallet);
router.post("/createWallet", createWallet);
router.post("/getFreelancerBalance", getFreelancerBalance);

module.exports = router;
