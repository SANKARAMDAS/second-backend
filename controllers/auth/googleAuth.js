const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Freelancer = require("../../models/freelancer");
const Business = require("../../models/business");
const client = new OAuth2Client(process.env.CLIENT_ID);

// GOOGLE-API

const verifyEmailGoogleAuth = async (req, res) => {
	const { payload } = await googleAuth(req.body.tokenId);
	if (payload["email_verified"]) {
		const business = await Business.findOne({ email: payload["email"] });
		const freelancer = await Freelancer.findOne({ email: payload["email"] });

		if (business || freelancer) {
			return res.status(400).send({ msg: "This email is already registered" });
		} else {
			res.status(200).send({
				data: {
					email: payload["email"],
					name: payload["name"],
				},
				msg: "Success",
			});
		}
	} else {
		res.status(400).send("There was an error accessing your google account.");
	}
};

const googleSignup = async (req, res) => {
	const { role, name, email } = req.body;
	try {
		if (role === "freelancer") {
			const newFreelancer = await new Freelancer({
				name: name,
				email: email,
				password: "1nejn13#google-login#n2j1k23n2j",
				address: "",
				city: "",
				state: "",
				country: "",
				zipCode: 0,
				taxId: "",
				wyreWallet: "",
				isProfileComplete: false,
				status: "Active"
			});
			const savedFreelancer = await newFreelancer.save();
			res.status(200).send({ msg: "Freelancer Registered" });
		} else {
			const newBusiness = await new Business({
				name: name,
				email: email,
				password: "1nejn13#google-login#n2j1k23n2j",
				address: "",
				city: "",
				state: "",
				country: "",
				zipCode: 0,
				taxId: "",
				wyreWallet: "",
				isProfileComplete: false,
				status: "Active"
			});
			const savedBusiness = await newBusiness.save();
			res.status(200).send({ msg: "Business Registered" });
		}
	} catch (err) {
		console.log(err.message)
		res.status(404).send({ msg: err.message });
	}
};

// Google Login
const googleLogin = async (req, res) => {
	const { payload } = await googleAuth(req.body.tokenId);
	console.log(payload)
	if (payload["email_verified"]) {
		const business = await Business.findOne({ email: payload["email"] });
		const freelancer = await Freelancer.findOne({ email: payload["email"] });
		let cookieEmail;
		let cookieRole;

		if (freelancer) {
			cookieEmail = freelancer.email;
			cookieRole = "freelancer";
		} else if (business) {
			cookieEmail = business.email;
			cookieRole = "business";
		} else {
			return res.status(400).send({
				msg: "This email is not registered",
			});
		}

		const accessToken = jwt.sign(
			{ data: { email: cookieEmail, role: cookieRole } },
			process.env.VERIFY_AUTH_TOKEN,
			{
				expiresIn: "30s",
			}
		);
		const refreshToken = jwt.sign(
			{ data: { email: cookieEmail, role: cookieRole } },
			process.env.VERIFY_REFRESH_TOKEN,
			{
				expiresIn: "3h",
			}
		);

		return res
			.status(202)
			.cookie("accessToken", accessToken, {
				expires: new Date(new Date().getTime() + 30 * 1000),
				httpOnly: true,
				sameSite: "strict",
				domain: process.env.DOMAIN
			})
			.cookie("authSession", true, {
				expires: new Date(new Date().getTime() + 30 * 1000),
				domain: process.env.DOMAIN
			})
			.cookie("refreshToken", refreshToken, {
				expires: new Date(new Date().getTime() + 3557600000),
				httpOnly: true,
				sameSite: "strict",
				domain: process.env.DOMAIN
			})
			.cookie("refreshTokenID", true, {
				expires: new Date(new Date().getTime() + 3557600000),
				domain: process.env.DOMAIN
			})
			.send({
				msg: "Logged in successfully",
				email: cookieEmail,
				role: cookieRole,
			});
	} else {
		res.status(400).send("There was an error accessing your google account.");
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
	verifyEmailGoogleAuth,
};
