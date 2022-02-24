const express = require("express");
const {
    enable2fa,
    disable2fa,
    verify2fa
} = require("../controllers/2fa");

const router = express.Router();

const { auth } = require("../middlewares/auth");

router.post("/enable", auth, enable2fa);
router.post("/verify", auth, verify2fa);
router.post("/disable", auth, disable2fa);

module.exports = router;
