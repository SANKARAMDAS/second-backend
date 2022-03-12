const express = require("express");
const {
    reinitialise
} = require("../../controllers/admin/reinitiate");

const router = express.Router();

const { adminAuth } = require("../../middlewares/admin");

router.post("/", adminAuth, reinitialise)

module.exports = router;
