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
	invoiceTitle: {
		type: String,
		required: true,
	},
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
	freelancerName: {
		type: String,
		trim: true,
		required: true,
	},
	businessName: {
		type: String,
		trim: true,
		required: true,
	},
	item: [
		{
			description: String,
			quantity: Number,
			price: Number,
		},
	],
	proportions: [
		{
			currency: String,
			percentage: Number,
			transferId: String,
		}
	],
	reservationId: {
		type: String
	},
	walletOrderId: {
		type: String
	},
	ACHTransferId: {
		type: String
	},
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
