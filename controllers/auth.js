const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const client = new OAuth2Client(process.env.CLIENT_ID);

// GOOGLE-API
const googleSignup = async (req, res) => {
	const { payload } = await googleAuth(req.tokenId);

	if (payload["email_verified"]) {
		const userExists = await User.findOne({ email: payload["email"] });
		console.log("user ex", userExists);
		if (userExists) {
			err = "Email already exists";
			res.status(400).send(err);
		} else {
			const user = await new User({
				name: payload["name"],
				email: payload["email"],
			});

			const savedUser = await user.save();
			const token = await user.generateAuthToken();
			req.session.token = token;
			res.status(200).send(savedUser);
		}
	} else {
		res.status(400).send("There was an error accessing your google account.");
	}
};

const googleLogin = async (req, res) => {
	const { payload } = await googleAuth(req.tokenId);

	if (payload["email_verified"]) {
		const userExists = await User.findOne({ email: payload["email"] });
		console.log("user ex", userExists);
		if (userExists) {
			res.send(userExists);
		} else {
			res.send();
		}
	} else {
		res.send("There was an error accessing your google account.");
	}
};

const googleAuth = async (tokenId) => {
	const ticket = await client.verifyIdToken({
		idToken: tokenId,
		audience: process.env.CLIENT_ID,
	});

	const payload = ticket.getPayload();

	return { payload: payload };
};

module.exports = {
	googleLogin,
	googleSignup,
};
