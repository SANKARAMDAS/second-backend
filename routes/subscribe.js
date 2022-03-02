const express = require("express");
const {
    addMember,
    createList
} = require("../controllers/subscribe");

const router = express.Router();

router.post("/", addMember);
router.post("/create", createList);

module.exports = router;
