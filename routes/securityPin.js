const express = require("express");
const {
    setSecurityPin,
    forgotPin,
    pinReset
} = require("../controllers/seurityPin");

const router = express.Router();

router.post("/", setSecurityPin);
router.post("/forgot", forgotPin);
router.post("/reset", pinReset);

module.exports = router;
