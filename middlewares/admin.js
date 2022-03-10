const jwt = require("jsonwebtoken");
const User = require("../models/user")

const adminAuth = async (req, res, next) => {
    const token = req.get("auth-token");

    if (!token) {
        return res.status(400).send({ error: "Access denied" });
    } else {

    }
};

module.exports = { adminAuth };