const express = require("express");
const {
    transferCrypto
} = require("../../controllers/wyre/transfer");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.post("/externalTransfer", auth, transferCrypto);

module.exports = router;
