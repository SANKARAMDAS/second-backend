const express = require("express");
const {
    enable2fa,
    disable2fa,
    verify2fa
} = require("../controllers/payoutAuth");

const router = express.Router();

const { auth } = require("../middlewares/auth");

router.post("/enable", enable2fa);
router.post("/verify", verify2fa);
router.post("/disable", disable2fa);

module.exports = router;
