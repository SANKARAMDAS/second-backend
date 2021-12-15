const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Freelancer = require("../../models/freelancer");
const Business = require("../../models/business");
const client = new OAuth2Client(process.env.CLIENT_ID);

// GOOGLE-API
const googleSignup = async (req, res) => {
	const { payload } = await googleAuth(req.body.tokenId);
	const { role } = req.body;

	if (payload["email_verified"]) {
		const business = await Business.findOne({ email: payload["email"] });
		const freelancer = await Freelancer.findOne({ email: payload["email"] });

		if (business || freelancer) {
			res.status(400).send({ msg: "This email is already registered" });
		} else {
			if (role === "freelancer") {
				const newFreelancer = await new Freelancer({
					name: payload["name"],
					email: payload["email"],
					password: "1nejn13#google-login#n2j1k23n2j",
					address: "",
					city: "",
					state: "",
					country: "",
					zipCode: 0,
					taxId: "",
					wyreWallet: "",
					isProfileComplete: false,
				});
				const savedFreelancer = await newFreelancer.save();
				res.status(200).send({ msg: "Freelancer Registered" });
			} else {
				const newBusiness = await new Business({
					name: payload["name"],
					email: payload["email"],
					password: "###",
				});
				const savedBusiness = await newBusiness.save();
				res.status(200).send({ msg: "Business Registered" });
			}
		}
	} else {
		res.status(400).send("There was an error accessing your google account.");
	}
};

// Google Login
const googleLogin = async (req, res) => {
	const { payload } = await googleAuth(req.body.tokenId);

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
			res.status(400).send({
				msg: "This email is not registered",
			});
		}

		const accessToken = jwt.sign(
			{ email: cookieEmail, role: cookieRole },
			process.env.VERIFY_AUTH_TOKEN,
			{
				expiresIn: "30s",
			}
		);
		const refreshToken = jwt.sign(
			{ email: cookieEmail, role: cookieRole },
			process.env.VERIFY_REFRESH_TOKEN,
			{
				expiresIn: "3h",
			}
		);

		console.log(cookieRole);
		res
			.status(202)
			.cookie("accessToken", accessToken, {
				expires: new Date(new Date().getTime() + 30 * 1000),
			})
			.cookie("refreshToken", refreshToken, {
				expires: new Date(new Date().getTime() + 3557600000),
			})
			.send({
				msg: "Logged in successfully",
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
};
