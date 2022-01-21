const express = require("express");
const {
    postContact
} = require("../controllers/contact");

const router = express.Router();

router.post("/", postContact);

module.exports = router;
