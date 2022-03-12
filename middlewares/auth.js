const jwt = require("jsonwebtoken");
const Freelancer = require("../models/freelancer")
const Business = require("../models/business")

const auth = async (req, res, next) => {
	const token = req.get("auth-token");

	if (!token) {
		return res.status(400).send({ error: "Access denied" });
	} else {
		try {
			const payload = await jwt.verify(token, process.env.VERIFY_AUTH_TOKEN);
			req.role = payload.data.role;
			if (req.role == 'freelancer') {
				req.user = await Freelancer.findOne({ email: payload.data.email })
			} else {
				req.user = await Business.findOne({ email: payload.data.email })
			}
			console.log(req.user, req.role)
			next();
		} catch (e) {
			if (e.name === "TokenExpiredError") {
				return res.status(400).send({ e: "Session timed out" });
			} else if (e.name === "JsonWebTokenError") {
				return res.status(400).send({ e: "Invalid token" });
			} else {
				return res.status(400).send({ e: "Unknown error" });
			}
		}
	}
};

module.exports = { auth };
