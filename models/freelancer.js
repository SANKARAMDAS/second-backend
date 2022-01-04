var mongoose = require("mongoose");
const validator = require("validator");
const { wyre } = require("../controllers/wyre/boilerplate");

const stringValue = {
	type: String,
	trim: true,
};

const numericValue = {
	type: String,
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
	zipCode: numericValue,
	taxId: numericValue,
	bitcoin: stringValue,
	ethereum: stringValue,
	bitcoinTransferId: stringValue,
	ethereumTransferId: stringValue,
	wyreWallet: {
		type: String,
	},
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
