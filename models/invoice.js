var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const value = {
	type: Number,
	trim: true,
	required: true,
	default: 0,
};

// Status Model
(Invoice = new Schema({
	status: {
		type: String,
		required: true,
	},
	invoiceId: {
		type: String,
		required: true,
	},
	businessEmail: {
		type: String,
		trim: true,
		required: true,
	},
	freelancerEmail: {
		type: String,
		trim: true,
		required: true,
	},
	item: [
		{
			description: String,
			qty: Number,
			unitPrice: Number,
		},
	],
	proportions: [
		{
			currency: String,
			percentage: Number,
			transferId: String,
		},
	],
	// ETH: value,
	// BTC: value,
	// FIAT: value,
	totalAmount: value,
	memo: {
		type: String,
		trim: true,
		required: true,
	},
	link: String,
	creationDate: String,
	dueDate: String,
})),
	(Invoice = mongoose.model("Invoice", Invoice));

module.exports = Invoice;
