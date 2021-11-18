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
	requestId: {
		type: String,
		required: true,
	},
	clientEmail: {
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
	ETH: value,
	BTC: value,
	TRX: value,
	totalAmount: value,
	memo: {
		type: String,
		trim: true,
		required: true,
	},
})),
	(Invoice = mongoose.model("Invoice", Invoice));

module.exports = Invoice;
