const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/user");
const { signup, signin } = require("../controllers/user");
const { sendEmail } = require("../controllers/sendEmail");

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/sendemail", sendEmail);

module.exports = router;
