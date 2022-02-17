const express = require("express");
const {
    createLinkToken,
    exchangePublicToken
} = require("../controllers/plaid");

const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/createLinkToken", createLinkToken);
router.post("/exchangePublicToken", exchangePublicToken)

module.exports = router;
