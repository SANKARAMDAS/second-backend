const express = require("express");
const {
    invite, accept, reject, getInvitations
} = require("../controllers/connections");

const router = express.Router();

router.post("/invite", invite);
router.post("/accept", accept);
router.post("/reject", reject);
router.post("/invitations", getInvitations);

module.exports = router;
