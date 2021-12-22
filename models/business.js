var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const validator = require("validator");

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
	isProfileComplete: {
		type: Boolean,
		default: false,
	},
});

mongoose.pluralize(null);
const Business = mongoose.model("Business", businessSchema);

module.exports = Business;