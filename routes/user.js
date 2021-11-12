const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/user");
const { signup, signin } = require("../controllers/user")

router.post("/signup", signup);

router.post("/signin", signin);

module.exports = router;
