const mongoose = require("mongoose");

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
    sender: {
        type: String,
        trim: true,
        required: true,
    },
    receiver: {
        type: String,
        trim: true,
        required: true,
    },
    method: {
        type: String,
        trim: true,
        required: true,
    },
    transferId: {
        type: String,
        trim: true,
    },
    source: {
        type: String,
        trim: true,
        required: true,
    },
    sourceCurrency: {
        type: String,
        trim: true,
        required: true,
    },
    destination: {
        type: String,
        trim: true,
        required: true,
    },
    destinationCurrency: {
        type: String,
        trim: true,
        required: true,
    },
    //in source currency
    amount: {
        type: String,
        trim: true,
        required: true,
    },
    status: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Number
    },
    invoiceId: {
        type: String,
        required: false
    },
    walletOrderId: {
        type: String,
        required: false
    }
});

mongoose.pluralize(null);
const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
