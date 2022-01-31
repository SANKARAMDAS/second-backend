var mongoose = require("mongoose");
var Schema = mongoose.Schema;
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
	zipCode: numericValue,
	taxId: numericValue,
	wyreWallet: {
		type: String,
	},
	fundWallet: [
		{
			amount: numericValue,
			reservationId: stringValue,
			walletOrderId: stringValue
		}
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
		console.log(e)
		throw new Error("there was an error creating wallet");
	}

	user.wyreWallet = result.id;
	await user.save();
	return result;
};

mongoose.pluralize(null);
const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
