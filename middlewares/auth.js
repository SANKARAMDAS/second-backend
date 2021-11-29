const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {

	const token = req.get("auth-token");

	if (!token) {
		return res.status(400).send({ error: "Access denied" });
	} else {
		try {
			const payload = jwt.verify(token, process.env.VERIFY_AUTH_TOKEN);
			const user = await User.findOne({ _id: payload._id })
			req.user = user
			next();
		} catch (e) {
			if (e.name === "TokenExpiredError") {
				return res.status(400).send({ e: "Session timed out" });
			} else if (e.name === "JsonWebTokenError") {
				return res.status(400).send({ e: "Invalid token" });
			} else {
				return res.status(400).send({ e: "abc" });
			}
		}
	}
};

module.exports = { auth };
