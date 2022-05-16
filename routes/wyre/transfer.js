const express = require("express");
const {
    transferCrypto, transferInitiate, wireTransfer
} = require("../../controllers/wyre/transfer");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

//send otp
router.post("/transferInitiate", auth, transferInitiate);
//transfer initiate
router.post("/externalTransfer", auth, transferCrypto);

router.post("/wireTransfer", auth, wireTransfer);


module.exports = router;
