const express = require("express");
const {
    addUser,
    signin, refresh
} = require("../../controllers/admin/auth");

const router = express.Router();

const { adminAuth } = require("../../middlewares/admin");

router.post("/adduser", adminAuth, addUser);
router.post("/signin", signin);
router.post("/refresh", refresh);

module.exports = router;
