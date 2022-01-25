const express = require("express");
const {
    getTransactionHistory, makeTransaction
} = require("../../controllers/wyre/transaction");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.get("/", auth, getTransactionHistory);

module.exports = router;
