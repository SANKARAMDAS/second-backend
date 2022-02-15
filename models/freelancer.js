var mongoose = require("mongoose");
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
const freelancerSchema = new mongoose.Schema({
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
	bitcoin: stringValue,
	ethereum: stringValue,
	bitcoinTransferId: stringValue,
	ethereumTransferId: stringValue,
	wyreWallet: {
		type: String,
	},
	paymentMethods: [
		{
			paymentmethodId: stringValue
		}
	],
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
	isProfileComplete: {
		type: Boolean,
		default: false,
	},
});

freelancerSchema.methods.createWallet = async function () {
	const user = this;
	let result;
	try {
		result = await wyre.post("/wallets", {
			type: "DEFAULT",
			name: user._id,
		});
	} catch (e) {
		throw new Error("there was an error creating wallet");
	}

	user.wyreWallet = result.id;
	await user.save();
	return result;
};

mongoose.pluralize(null);
const Freelancer = mongoose.model("Freelancer", freelancerSchema);

module.exports = Freelancer;
