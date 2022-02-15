const express = require("express");
const {
    getTransactionHistory, getTransaction, getWalletOrderStatus
} = require("../../controllers/wyre/transaction");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.post("/getTransactions", getTransactionHistory);

module.exports = router;
