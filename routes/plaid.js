const express = require("express");
const {
    createLinkToken,
    exchangePublicToken
} = require("../controllers/plaid");

const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/createLinkToken", auth, createLinkToken);
router.post("/exchangePublicToken", auth, exchangePublicToken)

module.exports = router;
