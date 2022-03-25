const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const speakEasy = require("speakeasy")
const Business = require("../../models/business");
const Freelancer = require("../../models/freelancer");
const { sendEmail } = require("../sendEmail");
const speakeasy = require("speakeasy")
const multer = require("multer")
const sharp = require("sharp")
const formidable = require("formidable")
const util = require("util")
const fs = require("fs")
const path = require("path")
const uploadFile = require("../../middlewares/upload");

// Generate OTP and Send on Email 1/4
// const generateOTP = async (email, name, password) => {
// 	const otp = Math.floor(100000 + Math.random() * 900000);
// 	console.log(otp);
// 	const ttl = 5 * 60 * 1000;
// 	const expires = Date.now() + ttl;
// 	const data = `${email}.${name}.${password}.${otp}.${expires}`;
// 	const hash = crypto
// 		.createHmac("sha256", process.env.HASHKEY)
// 		.update(data)
// 		.digest("hex");
// 	const fullHash = `${hash}.${expires}`;

// 	const emailBody = `
// 	<div>
// 		<p style="font-weight: bold;" >Hello ${name},</p>
// 		<p>Your OTP to verify email is ${otp}</p>
// 		<p>If you have not registered on the website, kindly ignore the email</p>
// 		<br/>
// 		<p>Have a Nice Day!</p>            
// 	</div>
// 	`;

// 	await sendEmail({ email: email, name: name }, emailBody, "OTP Verification");

// 	return {
// 		fullHash: fullHash,
// 		otp: otp,
// 		expires: expires,
// 	};
// };

// // Send OTP 2/4
// const sendOtp = async (req, res) => {
// 	const { name, email, password } = req.body;

// 	const freelancer = await Freelancer.findOne({ email: email });
// 	const business = await Business.findOne({ email: email });

// 	// Freelancer
// 	if (freelancer === null) {
// 		if (business === null) {
// 			// sendOTP
// 			const { fullHash, otp, expires } = await generateOTP(
// 				email,
// 				name,
// 				password
// 			);
// 			console.log(fullHash, otp, expires);
// 			res.status(200).send({
// 				msg: "Verified",
// 				data: {
// 					expires,
// 					hash: fullHash,
// 					name,
// 					email,
// 					password,
// 					otp,
// 				},
// 			});
// 		} else {
// 			res.status(400).send({ msg: "Business Already Exists with this Email" });
// 		}
// 	} else if (business === null) {
// 		if (freelancer === null) {
// 			// sendOTP
// 			const { fullHash, otp, expires } = await generateOTP(
// 				email,
// 				name,
// 				password
// 			);
// 			console.log(fullHash, otp, expires);
// 			res.status(200).send({
// 				msg: "Verified",
// 				data: {
// 					expires,
// 					hash: fullHash,
// 					name,
// 					email,
// 					password,
// 					otp,
// 				},
// 			});
// 		} else {
// 			res.status(400).send({ msg: "Business Already Exists with this Email" });
// 		}
// 	} else {
// 		res.status(400).send({ msg: "Error" });
// 	}
// };

// // Signup user on Email verification 3/4
// const verifyOtp = async (req, res) => {
// 	const { name, email, password, otp, hash } = req.body;
// 	console.log(req.body);

// 	let [hashValue, expires] = hash.split(".");

// 	let now = Date.now();

// 	if (now > parseInt(expires)) {
// 		return res.status(401).send({ msg: "OTP Timeout" });
// 	}

// 	const data = `${email}.${name}.${password}.${otp}.${expires}`;

// 	const newCalculatedHash = crypto
// 		.createHmac("sha256", process.env.HASHKEY)
// 		.update(data)
// 		.digest("hex");

// 	if (newCalculatedHash === hashValue) {
// 		res.status(200).send({ msg: "success" });
// 	} else {
// 		res.status(400).send({ msg: "Invalid OTP" });
// 	}
// };

// // Register user 4/4
// const signup = async (req, res) => {
// 	const { name, email, password, role } = req.body;
// 	if (role === "freelancer") {
// 		const newFreelancer = new Freelancer({
// 			name: name,
// 			password: password,
// 			email: email,
// 			address: "",
// 			city: "",
// 			state: "",
// 			country: "",
// 			zipCode: "",
// 			taxId: "",
// 			wyreWallet: "",
// 			isProfileComplete: false,
// 		});
// 		try {
// 			await newFreelancer.createWallet();
// 			const savedUser = await newFreelancer.save();
// 			return res.status(200).send({
// 				msg: "Freelancer Added Successfully",
// 			});
// 		} catch (err) {
// 			console.log(err);
// 			return res.status(400).send({ msg: err });
// 		}
// 	} else {
// 		const newBusiness = new Business({
// 			name: name,
// 			password: password,
// 			email: email,
// 			address: "",
// 			city: "",
// 			state: "",
// 			country: "",
// 			zipCode: "",
// 			taxId: "",
// 			wyreWallet: "",
// 			isProfileComplete: false,
// 		});
// 		try {
// 			await newBusiness.createWallet();
// 			const savedUser = await newBusiness.save();
// 			return res.status(200).send({
// 				msg: "Business Added Successfully",
// 			});
// 		} catch (err) {
// 			console.log(err);
// 			return res.status(400).send({ msg: err });
// 		}
// 	}
// };

// Sign In


const signup = async (req, res) => {
	const { name, email, password } = req.body;

	const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var confirmationCode = '';
	for (var i = 0; i < 25; i++) {
		confirmationCode += characters[Math.floor(Math.random() * characters.length)];
	}

	try {

		const user = await Freelancer.findOne({ email })
		const user2 = await Business.findOne({ email })
		console.log(user, user2)
		if (user || user2) {
			return res.status(400).send({ message: "Email already registered" })
		}

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
			confirmationCode
		});

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
			confirmationCode
		});


		await newFreelancer.createWallet();
		const savedUser = await newFreelancer.save();
		await newBusiness.createWallet();
		const savedUser2 = await newBusiness.save();

		const link = `https://rdx.binamite.com/confirm/${confirmationCode}`;

		const emailBody = `
	<div>
		<p style="font-weight: bold;" >Hello ${name},</p>
		<p>You have one more step remaining to activate your Binamite account. <br>Click on the Link to verify your email address: <a href=${link}>Link</a></p>
		<p>If you have not registered on the website, kindly ignore the email</p>
		<br/>
		<p>Have a Nice Day!</p>            
	</div>
	`;

		await sendEmail({ email: email, name: name }, emailBody, "Email Verification");

		return res.status(200).send({
			msg: "User Added Successfully",
		});
	} catch (err) {
		console.log(err);
		return res.status(400).send({ msg: err });
	}

};

const emailVerify = async (req, res) => {
	const { confirmationCode, role } = req.body

	try {
		if (role === "Freelancer") {
			await Business.deleteOne({ confirmationCode })
			const user = await Freelancer.findOne({ confirmationCode })
			if (!user) {
				return res.status(404).send({ message: "Invalid or Expired Link." })
			}
			user.status = "Active"
			console.log(user)
			await user.save()
		} else {
			await Freelancer.deleteOne({ confirmationCode })
			const user = await Business.findOne({ confirmationCode })
			if (!user) {
				return res.status(404).send({ message: "Invalid or Expired Link." })
			}
			user.status = "Active"
			await user.save()
		}
		res.status(200).send({ message: "account verified" })
	} catch (e) {
		console.log(e)
		res.status(400).send()
	}

}

const resendEmail = async (req, res) => {

	const { email } = req.body

	try {
		const userf = await Freelancer.findOne({ email })
		const userb = await Business.findOne({ email })

		if (!userf && !userb) {
			return res.status(404).send({ message: "User not found." })
		}

		if ((userf && userf.status === "Active") || (userb && userb.status === "Active")) {
			return res.status(404).send({ message: "User already verified." })
		}

		const link = `https://rdx.binamite.com/confirm/${userf.confirmationCode}`;

		const emailBody = `
	<div>
		<p style="font-weight: bold;" >Hello ${userf.name},</p>
		<p>You have one more step remaining to activate your Binamite account. <br>Click on the Link to verify your email address: <a href=${link}>Link</a></p>
		<p>If you have not registered on the website, kindly ignore the email</p>
		<br/>
		<p>Have a Nice Day!</p>            
	</div>
	`;

		await sendEmail({ email: email, name: userf.name }, emailBody, "Email Verification");

		res.status(200).send({ message: "Email sent." })

	} catch (e) {
		res.status(400).send()
	}

}

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

					if (freelancer.status != "Active") {
						return res.status(401).send({
							message: "Pending Account. Please Verify Your Email!",
						});
					}
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

						if (business.status != "Active") {
							return res.status(401).send({
								message: "Pending Account. Please Verify Your Email!",
							});
						}

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
				domain: process.env.DOMAIN
			})
			.cookie("authSession", true, {
				expires: new Date(new Date().getTime() + 30 * 1000),
				domain: process.env.DOMAIN
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

	const user = req.user
	try {
		res.send({ data: user });
	} catch (err) {
		console.log(err)
		res.status(403).send({ msg: err });
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
		skills
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

						bitcoin,
						ethereum,
						skills
					},
				}
			);
			return res.status(200).send({ msg: "Profile Updated Successfully" });
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
						bitcoin,
						ethereum,
					},
				}
			);
			return res.status(200).send({ msg: "Profile Updated Successfully" });
		} else {
			return res.status(400).send({ message: "error" })
		}
	} catch (err) {
		res.status(400).send({ msg: err });
	}
};

const uploadDocument = async (req, res) => {

	try {
		const user = req.user
		if (user.kycStatus === 'Active' || user.kycStatus === 'Pending') {
			return res.status(400).send({ message: "KYC status: " + user.kycStatus });
		}
		await uploadFile(req, res);
		if (req.file == undefined) {
			return res.status(400).send({ message: "Please upload a file!" });
		}

		user.document = req.file.filename
		user.kycStatus = 'Pending'
		await user.save()


		res.status(200).send({
			message: "Uploaded the file successfully: " + req.file.originalname,
		});
	} catch (err) {
		if (err.message === "Upload .png, .jpg or .jpeg") {
			return res.status(400).send({
				message: err.message
			});
		}
		res.status(500).send({
			message: `Could not upload the file: ${req.file.originalname}. ${err}`,
		});
	}
};

// Logout User
const logout = async (req, res) => {
	try {
		res
			.cookie("refreshToken", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: process.env.DOMAIN
			})
			.cookie("accessToken", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: process.env.DOMAIN
			})
			.cookie("authSession", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: process.env.DOMAIN
			})
			.cookie("refreshTokenID", "none", {
				expires: new Date(Date.now() + 5 * 1000),
				httpOnly: true,
				domain: process.env.DOMAIN
			})
			.send("User Logged Out");
	} catch (e) {
		console.log(e);
		return res.status(400).send(e);
	}
};

module.exports = {
	// sendOtp,
	// verifyOtp,
	emailVerify,
	resendEmail,
	signup,
	signin,
	forgotPassword,
	passwordReset,
	updateProfile,
	getUserProfile,
	getUser,
	logout,
	refresh,
	validate2fa,
	uploadDocument
};
