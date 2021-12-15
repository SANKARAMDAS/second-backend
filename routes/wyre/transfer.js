const express = require("express");
const {
    transferCrypto
} = require("../../controllers/wyre/transfer");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.post("/externalTransfer", transferCrypto);

module.exports = router;
