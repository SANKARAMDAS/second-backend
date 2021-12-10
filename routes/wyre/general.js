const express = require("express");
const {
    getWallet,
    createWallet
} = require("../../controllers/wyre/general");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.get("/getWallet", auth, getWallet);
router.post("/createWallet", auth, createWallet)

module.exports = router;
