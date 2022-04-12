const express = require("express");
const {
    getTransactionHistory, getWalletOrderStatus, enableorder
} = require("../../controllers/wyre/transaction");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.post("/getTransactions", getTransactionHistory);
router.post("/getOrderStatus", getWalletOrderStatus);
router.post("/enableorder", enableorder);

module.exports = router;
