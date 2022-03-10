const express = require("express");
const {
    getUsers, getAccount
} = require("../../controllers/admin/general");

const router = express.Router();

// const { auth } = require("../middlewares/auth");

router.get("/getUsers", getUsers)
router.get("/getAccount", getAccount)


module.exports = router;
