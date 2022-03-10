const express = require("express");
const {
    addUser,
    signin
} = require("../../controllers/admin/auth");

const router = express.Router();

// const { auth } = require("../middlewares/auth");

router.post("/addUser", addUser);
router.post("/signin", signin);


module.exports = router;
