var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const value = {
	type: String,
	trim: true,
	required: true,
	default: 0,
}

// Status Model
(invoiceSchema = new Schema({
	email: {
		type: String,
		trim: true,
		required: true,
	},
	description:{
		type: String,
		trim: true,
		required: true,
	},
	ETH: value,
	BTC: value,
	TRX: value,
	totalAmount: value,
})),
	(InvoiceSchema = mongoose.model("invoiceSchema", invoiceSchema));

module.exports = InvoiceSchema;
