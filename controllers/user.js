const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const User = require("../models/user");
const { sendEmail } = require("./sendEmail");
const { accountCreation } = require("../controllers/stripe/onBoarding");
let err;

// Register User
const sendOtp = async (req, res) => {
	const { name, email, password } = req.body;

	const userExists = await User.findOne({ email: req.body.email });
	if (userExists) {
		err = "Email already exists";
		return res.status(400).send(err);
	} else {
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

		await sendEmail(
			{ email: email, name: name },
			emailBody,
			"OTP Verification"
		);
		res.status(200).send({
			msg: "Verified",
			expires,
			hash: fullHash,
			name,
			email,
			password,
			otp,
		});
	}
};

const signup = async (req, res) => {
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
		const { accountId } = await accountCreation(email);
		console.log(accountId);
		const user = new User({
			name,
			email,
			password,
			stripeAccountId: accountId,
		});
		try {
			const savedUser = await user.save();
			await user.createWallet()
			const accessToken = await user.createAuthToken();
			const refreshToken = await user.createRefreshToken();
			return res.status(200).send({
				accessToken,
				refreshToken,
			});
		} catch (err) {
			console.log(err);
			return res.status(400).send(err);
		}
	} else {
		res.status(400).send({ msg: "Invalid OTP" });
	}
};

const signin = async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const accessToken = await user.createAuthToken();
		const refreshToken = await user.createRefreshToken();
		res.status(200).send({ accessToken, refreshToken });
	} catch (e) {
		res.status(400).send(e);
	}
};

const generateAccessToken = async (req, res) => {
	const { refreshToken } = req.body;

	if (!refreshToken) {
		return res.status(400).send({ error: "access denied" });
	} else {
		const user = await User.findOne({ refreshToken });
		if (!user) res.status(400).send({ error: "access denied" });
		const decoded = jwt.verify(refreshToken, process.env.VERIFY_REFRESH_TOKEN);
		if (decoded._id != user._id) res.status(400).send();

		const accessToken = jwt.sign(
			{ _id: user._id.toString() },
			process.env.VERIFY_AUTH_TOKEN,
			{
				expiresIn: "10m",
			}
		);

		res.status(200).send({ accessToken });
	}
};

const logout = async (req, res) => {
	try {
		const user = req.user;
		console.log(user);
		user.refreshToken = null;
		user.save();
		return res.status(200).send({ success: "user logged out" });
	} catch (e) {
		console.log(e);
		return res.status(400).send(e);
	}
};

const forgotPassword = async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		return res.status(400).send("Email does not exist");
	}

	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.JWT_VERIFY,
		{ expiresIn: "30 minutes" }
	);

	const hash = await bcrypt.hash(token.toString("hex"), 10);

	await User.findByIdAndUpdate({ _id: user._id }, { resetToken: hash });

	const link = `localhost:4001/api/auth/passwordreset?id=${user._id}&token=${token}`;
	console.log(link);

	const emailBody = `<p> Hey ${user.name} <br/>
                        Your reset password link is: <br/>
                        <a href=${link}>${link}</a></p>`;
	await sendEmail({ email: email }, emailBody, "Password Reset");

	res.status(200).send({ link, token, id: user._id });
};

const passwordReset = async (req, res) => {
	const { token, id, password } = req.body;
	let decoded;

	if (!ObjectId.isValid(id)) {
		return res.status(400).send();
	}

	const user = await User.findById(id);
	if (!user) {
		return res.status(400).send({ error: "invalid or expired url" });
	}

	const isMatch = await bcrypt.compare(token, user.resetToken);

	if (!isMatch) {
		return res.status(400).send({ error: "invalid or expired url" });
	}

	try {
		decoded = jwt.verify(token, process.env.VERIFY_TOKEN);
	} catch (e) {
		return res.status(400).send({ error: "invalid or expired url" });
	}

	if (decoded._id != id) {
		return res.status(400).send({ error: "invalid or expired url" });
	}

	const hash = await bcrypt.hash(password, 10);

	try {
		await User.findByIdAndUpdate({ _id: id }, { password: hash });
	} catch (e) {
		return res.status(400).send();
	}

	res.status(200).send({ user });
};

const getUser = (req, res) => {
	try {
		res.status(200).send(req.user);
	} catch (e) {
		res.status(500).send(e);
	}
};

const updateProfile = async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ["ethWallet", "bitcoinWallet", "name", "company"];
	const isValidOperation = updates.every((update) =>
		allowedUpdates.includes(update)
	);

	if (!isValidOperation) {
		return res.status(400).send({ error: "Invalid updates!" });
	}

	try {
		updates.forEach((update) => (req.user[update] = req.body[update]));
		await req.user.save();
		res.status(200).send(req.user);
	} catch (e) {
		console.log(e);
		res.status(500).send();
	}
};

module.exports = {
	sendOtp,
	signin,
	signup,
	forgotPassword,
	passwordReset,
	generateAccessToken,
	logout,
};
