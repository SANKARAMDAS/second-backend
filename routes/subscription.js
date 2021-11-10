const express = require("express");
const {
    addMember
} = require("../controllers/subscription");

const router = express.Router();

//Add member to mailing list
router.post("/add-member", addMember);

module.exports = {
    route: router,
};