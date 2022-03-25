const express = require("express");
const {
    getUser,
    getDocument,
    accept,
    reject
} = require("../../controllers/admin/kyc");

const router = express.Router();

const { adminAuth } = require("../../middlewares/admin");

router.post("/user", adminAuth, getUser)
router.post("/document", adminAuth, getDocument)
router.post("/accept", adminAuth, accept)
router.post("/reject", adminAuth, reject)

module.exports = router;
