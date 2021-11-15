const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const { sendEmail } = require("./sendEmail");
let err;

const signup = async (req, res) => {
	const { name, email, password, password2, role } = req.body;

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
	}

	const salt = await bcrypt.genSalt(10);
	const hashPassword = await bcrypt.hash(req.body.password, salt);

	const user = new User({
		name,
		email,
		password: hashPassword,
		role,
	});

	try {
		const savedUser = await user.save();
		const token = await user.generateAuthToken();
		req.session.token = token;
		return res.status(200).send(savedUser);
	} catch (err) {
		console.log(err);
		return res.status(400).send(err);
	}
};

const signin = async (req, res) => {
	// Check for role
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

module.exports = {
	signin,
	signup,
	forgotPassword,
	passwordReset,
};
