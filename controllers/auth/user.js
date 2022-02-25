const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const speakEasy = require("speakeasy")
const Business = require("../../models/business");
const Freelancer = require("../../models/freelancer");
const { sendEmail } = require("../sendEmail");
const speakeasy = require("speakeasy")

// Generate OTP and Send on Email 1/4
const generateOTP = async (email, name, password) => {
	const otp = Math.floor(100000 + Math.random() * 900000);
	console.log(otp);
	const ttl = 5 * 60 * 1000;
	const expires = Date.now() + ttl;
	const data = `${email}.${name}.${password}.${otp}.${expires}`;
	const hash = crypto
		.createHmac("sha256", process.env.HASHKEY)
		.update(data)
		.digest("hex");
	const fullHash = `${hash}.${expires}`;

	const emailBody = `
	<div>
		<p style="font-weight: bold;" >Hello ${name},</p>
		<p>Your OTP to verify email is ${otp}</p>
		<p>If you have not registered on the website, kindly ignore the email</p>
		<br/>
		<p>Have a Nice Day!</p>            
	</div>
	`;

	await sendEmail({ email: email, name: name }, emailBody, "OTP Verification");

	return {
		fullHash: fullHash,
		otp: otp,
		expires: expires,
	};
};

// Send OTP 2/4
const sendOtp = async (req, res) => {
	const { name, email, password } = req.body;

	const freelancer = await Freelancer.findOne({ email: email });
	const business = await Business.findOne({ email: email });

	// Freelancer
	if (freelancer === null) {
		if (business === null) {
			// sendOTP
			const { fullHash, otp, expires } = await generateOTP(
				email,
				name,
				password
			);
			console.log(fullHash, otp, expires);
			res.status(200).send({
				msg: "Verified",
				data: {
					expires,
					hash: fullHash,
					name,
					email,
					password,
					otp,
				},
			});
		} else {
			res.status(400).send({ msg: "Business Already Exists with this Email" });
		}
	} else if (business === null) {
		if (freelancer === null) {
			// sendOTP
			const { fullHash, otp, expires } = await generateOTP(
				email,
				name,
				password
			);
			console.log(fullHash, otp, expires);
			res.status(200).send({
				msg: "Verified",
				data: {
					expires,
					hash: fullHash,
					name,
					email,
					password,
					otp,
				},
			});
		} else {
			res.status(400).send({ msg: "Business Already Exists with this Email" });
		}
	} else {
		res.status(400).send({ msg: "Error" });
	}
};

// Signup user on Email verification 3/4
const verifyOtp = async (req, res) => {
	const { name, email, password, otp, hash } = req.body;
	console.log(req.body);

	let [hashValue, expires] = hash.split(".");

	let now = Date.now();

	if (now > parseInt(expires)) {
		return res.status(401).send({ msg: "OTP Timeout" });
	}

	const data = `${email}.${name}.${password}.${otp}.${expires}`;

	const newCalculatedHash = crypto
		.createHmac("sha256", process.env.HASHKEY)
		.update(data)
		.digest("hex");

	if (newCalculatedHash === hashValue) {
		res.status(200).send({ msg: "success" });
	} else {
		res.status(400).send({ msg: "Invalid OTP" });
	}
};

// Register user 4/4
const signup = async (req, res) => {
	const { name, email, password, role } = req.body;
	if (role === "freelancer") {
		const newFreelancer = new Freelancer({
			name: name,
			password: password,
			email: email,
			address: "",
			city: "",
			state: "",
			country: "",
			zipCode: "",
			taxId: "",
			wyreWallet: "",
			isProfileComplete: false,
		});
		try {
			await newFreelancer.createWallet();
			const savedUser = await newFreelancer.save();
			return res.status(200).send({
				msg: "Freelancer Added Successfully",
			});
		} catch (err) {
			console.log(err);
			return res.status(400).send({ msg: err });
		}
	} else {
		const newBusiness = new Business({
			name: name,
			password: password,
			email: email,
			address: "",
			city: "",
			state: "",
			country: "",
			zipCode: "",
			taxId: "",
			wyreWallet: "",
			isProfileComplete: false,
		});
		try {
			await newBusiness.createWallet();
			const savedUser = await newBusiness.save();
			return res.status(200).send({
				msg: "Business Added Successfully",
			});
		} catch (err) {
			console.log(err);
			return res.status(400).send({ msg: err });
		}
	}
};

// Sign In
const signin = async (req, res) => {
	const { email, password } = req.body;

	try {
		let cookieEmail;
		let cookieRole;
		const freelancer = await Freelancer.findOne({ email: email });
		const business = await Business.findOne({ email: email });

		if (freelancer === null && business === null) {
			return res.status(404).send({
				msg: "This email is not Registered ",
			});
		} else {
			if (freelancer) {
				if (freelancer.password === password) {
					cookieEmail = freelancer.email;
					cookieRole = "freelancer";
				} else {
					return res.status(400).send({
						msg: "Invalid Credentials",
					});
				}
			} else {
				if (business) {
					if (business.password === password) {
						cookieEmail = business.email;
						cookieRole = "business";
					} else {
						return res.status(400).send({
							msg: "Invalid Credentials",
						});
					}
				} else {
					return res.status(400).send({
						msg: "Invalid Credentials",
					});
				}
			}


			if ((cookieRole === "business" && business.is2faenabled === true) || (cookieRole === "freelancer" && freelancer.is2faenabled === true)) {
				return res.status(200).send({ cookieEmail, cookieRole })
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

			res
				.status(202)
				.cookie("accessToken", accessToken, {
					expires: new Date(new Date().getTime() + 30 * 1000),
					httpOnly: true,
					sameSite: "strict",
					domain: '.binamite.com'
				})
				.cookie("authSession", true, {
					expires: new Date(new Date().getTime() + 30 * 1000),
					domain: '.binamite.com'
				})
				.cookie("refreshToken", refreshToken, {
					expires: new Date(new Date().getTime() + 3557600000),
					httpOnly: true,
					sameSite: "strict",
					domain: '.binamite.com'
				})
				.cookie("refreshTokenID", true, {
					expires: new Date(new Date().getTime() + 3557600000),
					domain: '.binamite.com'
				})
				.send({
					msg: "Logged in successfully",
					email: cookieEmail,
					role: cookieRole,
					domain: '.binamite.com'
				});
		}
	} catch (err) {
		res.send({ msg: err });
	}
};

//validate2fa
const validate2fa = async (req, res) => {
	const { cookieEmail, cookieRole, token } = req.body

	try {

		let user
		if (cookieRole === "freelancer") {
			user = await Freelancer.findOne({ email: cookieEmail })
		} else {
			user = await Business.findOne({ email: cookieEmail })
		}

		if (!user || !user.tempSecret || !user.is2faenabled) {
			return res.status(40).send()
		}

		const secret = user.tempSecret;

		const tokenValidate = speakeasy.totp.verify({
			secret,
			encoding: "base32",
			token,
			window: 1
		});

		if (tokenValidate) {

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
					domain: '.binamite.com'
				})
				.cookie("authSession", true, {
					expires: new Date(new Date().getTime() + 30 * 1000),
					domain: '.binamite.com'
				})
				.cookie("refreshToken", refreshToken, {
					expires: new Date(new Date().getTime() + 3557600000),
					httpOnly: true,
					sameSite: "strict",
					domain: '.binamite.com'
				})
				.cookie("refreshTokenID", true, {
					expires: new Date(new Date().getTime() + 3557600000),
					domain: '.binamite.com'
				})
				.send({
					msg: "Logged in successfully",
					email: cookieEmail,
					role: cookieRole,
				});

		} else {
			return res.status(400).send()
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({
			message: "Error validating and finding user",
		});
	}
}

// Refresh Route
const refresh = (req, res) => {
	const refreshToken = req.cookies.refreshToken;
	if (!refreshToken) {
		return res.status(403).send({
			msg: "Refresh Token Not Found, Please Login Again",
		});
	}
	try {
		const payload = jwt.verify(refreshToken, process.env.VERIFY_REFRESH_TOKEN);
		const accessToken = jwt.sign(
			{ data: { email: payload.data.email, role: payload.data.role } },
			process.env.VERIFY_AUTH_TOKEN,
			{
				expiresIn: "30s",
			}
		);
		res
			.status(202)
			.cookie("accessToken", accessToken, {
				expires: new Date(new Date().getTime() + 30 * 1000),
				sameSite: "strict",
				httpOnly: true,
				domain: '.binamite.com'
			})
			.cookie("authSession", true, {
				expires: new Date(new Date().getTime() + 30 * 1000),
				domain: '.binamite.com'
			})
			.send({ email: payload.data.email, role: payload.data.role });
	} catch (err) {
		res.status(403).send({ msg: err, success: false });
	}
};

const getUser = async (req, res) => {
	const accessToken = req.cookies.accessToken;
	if (!accessToken) {
		return res.status(403).send({
			msg: "Access Token Not Found",
		});
	}
	try {
		const payload = jwt.verify(accessToken, process.env.VERIFY_AUTH_TOKEN);
		res.send({ email: payload.data.email, role: payload.data.role });
	} catch (err) {
		res.status(403).send({ msg: err });
	}
};

// Forgot Password
const forgotPassword = async (req, res) => {
	const { user_email } = req.body;
	try {
		const freelancer = await Freelancer.findOne({ email: user_email });
		const business = await Business.findOne({ email: user_email });

		let email;
		let name;

		if (freelancer === null && business === null) {
			res.status(400).send({ msg: "Email is not registered" });
		} else {
			if (freelancer) {
				email = freelancer.email;
				name = freelancer.name;
			} else {
				email = business.email;
				name = business.name;
			}
			const link = `localhost:3000/api/auth/passwordreset/${email}`;
			console.log(link);

			const emailBody = `<p> Hey ${name} <br/>
								Your reset password link is: <br/>
								<a href=${link}>${link}</a></p>`;
			await sendEmail({ email: email }, emailBody, "Password Reset");

			res.status(200).send({
				msg: "Password Reset Link sent successfully",
				data: { link: link, email: email },
			});
		}
	} catch (err) {
		res.status(400).send({ msg: err });
	}
};

// Password Reset
const passwordReset = async (req, res) => {
	const { email, password } = req.body;
	try {
		const freelancer = await Freelancer.findOne({ email: email });
		const business = await Business.findOne({ email: email });

		if (freelancer) {
			await Freelancer.findOneAndUpdate(
				{ _id: freelancer._id },
				{ password: password }
			);
			res.status(200).send({ msg: "Password reset was successful" });
		} else if (business) {
			await Business.findOneAndUpdate(
				{ _id: business._id },
				{ password: password }
			);
			res.status(200).send({ msg: "Password reset was successful" });
		} else {
			res.status(400).send({ msg: "Email doesnot exist" });
		}
	} catch (err) {
		res.status(400).send({ msg: err });
	}
};

// Get user Profile
const getUserProfile = async (req, res) => {
	const { email } = req.body;

	try {
		const freelancer = await Freelancer.findOne({ email: email });
		const business = await Business.findOne({ email: email });
		if (freelancer) {
			res.status(200).send({ data: freelancer });
		} else if (business) {
			res.status(200).send({ data: business });
		} else {
			res.status(404).send({ msg: "User not found" });
		}
	} catch (err) {
		res.send(400).send({ msg: err });
	}
};

// Update Profile
const updateProfile = async (req, res) => {
	const {
		email,
		address,
		city,
		state,
		zipCode,
		country,
		taxId,
		bitcoin,
		ethereum,
	} = req.body;
	try {
		const freelancer = await Freelancer.findOne({ email: email });
		const business = await Business.findOne({ email: email });
		if (freelancer) {
			await Freelancer.findOneAndUpdate(
				{ email: email },
				{
					$set: {
						address: address,
						city: city,
						state: state,
						zipCode: zipCode,
						country: country,
						taxId: taxId,
						isProfileComplete: true,
						bitcoin,
						ethereum,
					},
				}
			);
			res.status(200).send({ msg: "Profile Updated Successfully" });
		} else if (business) {
			await Business.findOneAndUpdate(
				{ email: email },
				{
					$set: {
						address: address,
						city: city,
						state: state,
						zipCode: zipCode,
						country: country,
						taxId: taxId,
						isProfileComplete: true,
						bitcoin,
						ethereum,
					},
				}
			);
			res.status(200).send({ msg: "Profile Updated Successfully" });
		}
	} catch (err) {
		res.status(400).send({ msg: err });
	}
};

// Logout User
const logout = async (req, res) => {
	try {
		res
			.cookie("refreshToken", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: '.binamite.com'
			})
			.cookie("accessToken", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: '.binamite.com'
			})
			.cookie("authSession", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: '.binamite.com'
			})
			.cookie("refreshTokenID", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: '.binamite.com'
			})
			.send("User Logged Out");
	} catch (e) {
		console.log(e);
		return res.status(400).send(e);
	}
};

module.exports = {
	sendOtp,
	verifyOtp,
	signup,
	signin,
	forgotPassword,
	passwordReset,
	updateProfile,
	getUserProfile,
	getUser,
	logout,
	refresh,
	validate2fa
};
