const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");

const client = new OAuth2Client(process.env.CLIENT_ID);

const googleLogin = async (req, res) => {
	const { tokenId } = req.body;

	const ticket = await client.verifyIdToken({
		idToken: tokenId,
		audience: process.env.CLIENT_ID,
	});

	const payload = ticket.getPayload();

	console.log("PAYLOAD", payload["email"]);

	if (payload["email_verified"]) {
		const userExists = await User.findOne({ email: payload["email"] });
		console.log("user ex", userExists);
		if (userExists) {
			err = "Email already exists";
			res.send(err);
		} else {
			const user = await new User({
				name: payload["name"],
				email: payload["email"],
			});

			const savedUser = await user.save();
			await user.createWallet()
			const token = await user.generateAuthToken();
			req.session.token = token;
			res.status(200).send(savedUser);
		}
	} else {
		res.send("There was an error accessing your google account.");
	}
};

module.exports = {
	googleLogin,
};
