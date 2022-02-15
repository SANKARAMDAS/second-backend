const express = require("express");
const {
    getTransactionHistory, getTransaction, getWalletOrderStatus
} = require("../../controllers/wyre/transaction");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

//get transaction history
router.get("/", auth, getTransactionHistory);
//webhook
router.post("/", getTransaction);
//wallet order webhook
router.post("/walletOrder", getWalletOrderStatus)


module.exports = router;
