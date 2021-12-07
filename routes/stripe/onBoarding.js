const express = require("express");
const {
	accountCreation,
	chargesEnabled,
	onBoarding,
} = require("../../controllers/stripe/onBoarding");

const router = express.Router();

router.post("/accountCreation", accountCreation);

router.post("/onBoarding", onBoarding);

router.post("/chargesEnabled", chargesEnabled);

module.exports = {
	route: router,
};
