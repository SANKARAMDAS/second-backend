const express = require("express");
const {
    addUser,
    signin
} = require("../../controllers/admin/auth");

const router = express.Router();

const { adminAuth } = require("../../middlewares/admin");

router.post("/addUser", adminAuth, addUser);
router.post("/signin", signin);


module.exports = router;
