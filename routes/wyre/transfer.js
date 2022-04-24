const express = require("express");
const {
    transferCrypto, transferInitiate
} = require("../../controllers/wyre/transfer");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

//send otp
router.post("/transferInitiate", transferInitiate);
//transfer initiate
router.post("/externalTransfer", transferCrypto);


module.exports = router;
