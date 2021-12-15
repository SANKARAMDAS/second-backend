const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const Business = require("../../models/business");
const Freelancer = require("../../models/freelancer");
const { sendEmail } = require("../sendEmail");

// Generate OTP and Send on Email
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
	<div style="padding:10px;  color: black ;font-size:16px; line-height: normal;">
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

// Check Role and Send OTP
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

// Signup user on Email verification
const verifyOtp = async (req, res) => {
	const { name, email, password, otp, hash } = req.body;

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
			zipCode: 0,
			taxId: "",
			wyreWallet: "",
			isProfileComplete: false,
		});
		try {
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
			zipCode: 0,
			taxId: "",
			wyreWallet: "",
			isProfileComplete: false,
		});
		try {
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

// Sign Up
const signin = async (req, res) => {
	const { email, password } = req.body;

	try {
		let cookieEmail;
		let cookieRole;
		const freelancer = await Freelancer.findOne({ email: email });
		const business = await Business.findOne({ email: email });

		if (freelancer === null && business === null) {
			res.status(404).send({
				msg: "This email is not Registered ",
			});
		} else {
			if (freelancer) {
				if (freelancer.password === password) {
					cookieEmail = freelancer.email;
					cookieRole = "freelancer";
					//set cookie
				} else {
					res.status(400).send({
						msg: "Invalid Credentials",
					});
				}
			} else {
				// For Business
				if (business) {
					if (business.password === password) {
						cookieEmail = business.email;
						cookieRole = "business";
					} else {
						res.status(400).send({
							msg: "Invalid Credentials",
						});
					}
				} else {
					res.status(400).send({
						msg: "Invalid Credentials",
					});
				}
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
					// httpOnly: true,
					// sameSite: "strict",
				})
				.cookie("refreshToken", refreshToken, {
					expires: new Date(new Date().getTime() + 3557600000),
					// httpOnly: true,
					// sameSite: "strict",
				})
				.send({
					msg: "Logged in successfully",
					role: cookieRole,
				});
		}
	} catch (err) {
		res.send({ msg: err });
	}
};

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
			{ data: { email: payload.email, role: payload.role } },
			process.env.VERIFY_REFRESH_TOKEN,
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
			})
			.send({ previousSessionExpiry: true, success: true });
	} catch (err) {
		res.status(403).send({ msg: err });
	}
};

// Forgot Password
const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const freelancer = await Freelancer.findOne({ email: email });
		const business = await Business.findOne({ email: email });

		let id;
		let name;

		if (freelancer === null && business === null) {
			res.status(400).send({ msg: "Email is nor registered" });
		} else {
			if (freelancer) {
				id = freelancer._id;
				name = freelancer.name;
			} else {
				id = business._id;
				name = business.name;
			}
			const link = `localhost:3000/api/auth/passwordreset?id=${id}`;
			console.log(link);

			const emailBody = `<p> Hey ${name} <br/>
								Your reset password link is: <br/>
								<a href=${link}>${link}</a></p>`;
			await sendEmail({ email: email }, emailBody, "Password Reset");

			res.status(200).send({
				msg: "Password Reset Link sent successfully",
				data: { link: link, id: id },
			});
		}
	} catch (err) {
		res.status(400).send({ msg: err });
	}
};

// Password Reset
const passwordReset = async (req, res) => {
	const { id, password } = req.body;
	try {
		const freelancer = await Freelancer.findOne({ _id: id });
		const business = await Business.findOne({ _id: id });

		if (freelancer) {
			await Freelancer.findByIdAndUpdate({ _id: id }, { password: password });
			res.status(200).send({ msg: "Password reset was successful" });
		} else if (business) {
			await Business.findByIdAndUpdate({ _id: id }, { password: password });
			res.status(200).send({ msg: "Password reset was successful" });
		} else {
			res.status(400).send({ msg: "Email doesnot exist" });
		}
	} catch (err) {
		res.status(400).send({ msg: err });
	}
};

const updateProfile = async (req, res) => {
	const { email, address, city, state, zipCode, country, taxId } = req.body;
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
						isProfileComplete,
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
					},
				}
			);
			res.status(200).send({ msg: "Profile Updated Successfully" });
		}
	} catch (err) {
		res.status(400).send({ msg: err });
	}
};

const logout = async (req, res) => {
	try {
		res
			.cookie("refreshToken", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
			})
			.cookie("accessToken", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
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
	signin,
	signup,
	forgotPassword,
	passwordReset,
	updateProfile,
	logout,
	refresh,
};
