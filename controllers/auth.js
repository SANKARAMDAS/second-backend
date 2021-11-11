const { OAuth2Client } = require("google-auth-library");

const User = require("../models/user");

const client = new OAuth2Client(process.env.CLIENT_ID);

const googleLogin = async (req, res) => {
	const { tokenId } = req.body;
	client
		.verifyIdToken({
			idToken: tokenId,
			audience: process.env.CLIENT_ID,
		})
		.then((response) => {
			const { email_verified, email, name } = response.payload;
			res.send(email_verified, email, name);
			if (email_verified) {
				// if verified?
				// check if email exists in db
				// of yes? only login
				// if no? add to db
			}
		});
};

module.exports = {
	googleLogin,
};
