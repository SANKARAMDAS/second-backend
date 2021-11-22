const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const User = require("../models/user");
const { sendEmail } = require("./sendEmail");
let err;

// Register User
const sendOtp = async (req, res, next) => {
	const { name, email, password, password2 } = req.body;

	if (!name || !email || !password || !password2) {
		err = "Please enter all fields";
		return res.status(400).send(err);
	}

	if (password != password2) {
		err = "Passwords do not match";
		return res.status(400).send(err);
	}

	if (password.length < 3) {
		err = "Password must be at least 3 characters";
		return res.status(400).send(err);
	}

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
		return res.send({ msg: "OTP Timeout" });
	}

	const data = `${email}.${name}.${password}.${otp}.${expires}`;

	const newCalculatedHash = crypto
		.createHmac("sha256", process.env.HASHKEY)
		.update(data)
		.digest("hex");

	const salt = await bcrypt.genSalt(10);
	const hashPassword = await bcrypt.hash(req.body.password, salt);

	if (newCalculatedHash === hashValue) {
		const user = new User({
			name,
			email,
			password: hashPassword,
		});
		try {
			const savedUser = await user.save();
			await user.createWallet();
			const token = await user.generateAuthToken();
			req.session.token = token;
			return res.status(200).send(savedUser);
		} catch (err) {
			console.log(err);
			return res.status(400).send(err);
		}
	} else {
		res.send({ msg: "Invalid OTP" });
	}
};

const signin = async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();
		req.session.token = token;
		res.send(user);
	} catch (e) {
		res.status(400).send(e.message);
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
		process.env.VERIFY_TOKEN,
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

	res.send({ link, token, id: user._id });
};

const passwordReset = async (req, res) => {
	const { token, id, password, password2 } = req.body;
	let decoded;

	if (!ObjectId.isValid(id) || password != password2) {
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
		res.send(req.user)
	} catch (e) {
		res.status(500).send(e)
	}
}

const updateProfile = async (req, res) => {

	const updates = Object.keys(req.body)
	const allowedUpdates = ['ethWallet', 'bitcoinWallet', 'name', 'company']
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid updates!' })
	}

	try {
		updates.forEach((update) => req.user[update] = req.body[update])
		await req.user.save()
		res.status(200).send(req.user)
	} catch (e) {
		console.log(e)
		res.status(500).send()
	}

}

module.exports = {
	sendOtp,
	signin,
	signup,
	forgotPassword,
	passwordReset,
};
