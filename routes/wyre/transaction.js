const express = require("express");
const {
    getTransactionHistory, getWalletOrderStatus, enableorder, getTransaction, getTransferStatus
} = require("../../controllers/wyre/transaction");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.post("/getTransactions", getTransactionHistory);
router.post("/getOrderStatus", getWalletOrderStatus);
router.post("/enableorder", enableorder);

router.post("/getTransferStatus", getTransferStatus)

//test
router.post("/wyreTransfer", getTransaction);

module.exports = router;
