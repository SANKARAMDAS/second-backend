const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { wyre } = require("../controllers/wyre/boilerplate")

// User Schema
const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: true,
	},
	email: {
		type: String,
		trim: true,
		required: true,
		validate(value) {
			if (!validator.isEmail(value)) {
				throw new Error("not an email");
			}
		},
	},
	password: {
		type: String,
		trim: true,
		validate(value) {
			if (value.length < 6) {
				throw new Error("not valid, less than 6 chars");
			} else if (value.includes("password")) {
				throw new Error("not valid, password contains password");
			}
		},
	},
	resetToken: {
		type: String,
	},
	wyreWallet: {
		type: String,
	},
	isProfileComplete: {
		type: Boolean,
		default: false,
	},
	refreshToken: {
		type: String,
		required: false,
	},
	stripeAccountId: {
		type: String,
	},
});

UserSchema.methods.createWallet = async function () {
	const user = this
	let result
	try {
		result = await wyre.post('/wallets', {
			type: 'DEFAULT',
			name: user._id
		})
	} catch (e) {
		console.log(e);
		throw new Error("there was an error creating wallet");
	}

	user.wyreWallet = result.id;
	user.save();
	return result;
}

UserSchema.methods.createAuthToken = async function () {
	const user = this;
	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.VERIFY_AUTH_TOKEN,
		{
			expiresIn: "10m",
		}
	);

	return token;
};

UserSchema.methods.createRefreshToken = async function () {
	const user = this;
	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.VERIFY_REFRESH_TOKEN,
		{
			expiresIn: "1d",
		}
	);

	try {
		await User.findByIdAndUpdate({ _id: user._id }, { refreshToken: token })
	} catch (e) {
		throw new Error(e)
	}
	return token;
};

UserSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error("no user exists with this email");
	}

	// const isMatch = await bcrypt.compare(password, user.password);

	if (user.password !== password) {
		throw new Error("unable to login!");
	}
	return user;
};

mongoose.pluralize(null);
const User = mongoose.model("User", UserSchema);

module.exports = User;
