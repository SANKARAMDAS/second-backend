const express = require("express");
const {
    addMember
} = require("../controllers/subscribe");

const router = express.Router();

router.post("/", addMember);

module.exports = router;
