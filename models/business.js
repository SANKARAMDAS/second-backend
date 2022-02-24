var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const validator = require("validator");
const { wyre } = require("../controllers/wyre/boilerplate");

const stringValue = {
	type: String,
	trim: true,
};

const numericValue = {
	type: Number,
	trim: true,
};

// Status Model
const businessSchema = new mongoose.Schema({
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
		required: true,
	},
	address: stringValue,
	city: stringValue,
	state: stringValue,
	country: stringValue,
	zipCode: stringValue,
	taxId: stringValue,
	wyreWallet: stringValue,
	securityPin: {
		type: String,
		trim: true,
		validate(value) {
			if (value.length != 6) {
				throw new Error("not valid, string length not eaqual to 6");
			} else if (value === "123456" || value === "000000") {
				throw new Error("not valid, choose a less common pin");
			}
		}
	},
	resetPinToken: stringValue,
	tempSecret: stringValue,
	qrUrl: stringValue,
	is2faenabled: {
		type: Boolean,
		default: false,
	},
	fundWallet: [
		{
			amount: numericValue,
			reservationId: stringValue,
			walletOrderId: stringValue,
			transferId: stringValue
		},
	],
	paymentMethods: [
		{
			paymentmethodId: stringValue
		}
	],
	isProfileComplete: {
		type: Boolean,
		default: false,
	},
});

businessSchema.methods.createWallet = async function () {
	const user = this;
	let result;
	try {
		result = await wyre.post("/wallets", {
			type: "DEFAULT",
			name: user._id,
		});
	} catch (e) {
		console.log(e);
		throw new Error("there was an error creating wallet");
	}

	user.wyreWallet = result.id;
	await user.save();
	return result;
};

mongoose.pluralize(null);
const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
