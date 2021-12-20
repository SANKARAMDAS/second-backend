const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
	const token = req.get("auth-token");

	if (!token) {
		return res.status(400).send({ error: "Access denied" });
	} else {
		try {
			const payload = jwt.verify(token, process.env.VERIFY_AUTH_TOKEN);
			req.role = payload.role;
			req.email = payload.email;
			console.log(role, email);
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
