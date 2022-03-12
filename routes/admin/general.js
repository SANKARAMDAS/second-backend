const express = require("express");
const {
    getUsers, getAccount, getTotalTransfer, getTransactions
} = require("../../controllers/admin/general");

const router = express.Router();

const { adminAuth } = require("../../middlewares/admin");

router.get("/getUsers", adminAuth, getUsers)
router.get("/getAccount", adminAuth, getAccount)
router.get('/totalTransfer', adminAuth, getTotalTransfer)
router.get('/transactions', adminAuth, getTransactions)


module.exports = router;
