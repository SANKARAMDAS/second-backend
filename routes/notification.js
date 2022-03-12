const express = require("express");
const {
    getNotifications
} = require("../controllers/notification");

const { auth } = require("../middlewares/auth");
const router = express.Router();

router.get("/", getNotifications);

module.exports = router;
