const mongoose = require("mongoose");
const express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

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
	company: {
		type: String,
		trim: true,
		required: false,
	},
	ethereumWallet: {
		type: String,
		trim: true,
		required: false,
	},
	role: {
		type: String,
		required: true,
	},
	isProfileComplete: {
		type: Boolean,
		default: false,
	},
	tokens: [
		{
			token: {
				type: String,
				required: true,
			},
		},
	],
});

UserSchema.methods.generateAuthToken = async function () {
	const user = this;
	const token = jwt.sign(
		{ _id: user._id.toString() },
		process.env.VERIFY_TOKEN
	);

	user.tokens = user.tokens.concat({ token });
	user.save();
	return token;
};

UserSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error("no user exists with this email");
	}

	const isMatch = await bcrypt.compare(password, user.password);

	if (!isMatch) {
		throw new Error("unable to login!");
	}
	return user;
};

mongoose.pluralize(null);
const User = mongoose.model("User", UserSchema);

module.exports = User;
