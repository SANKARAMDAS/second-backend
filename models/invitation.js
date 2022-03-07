const mongoose = require("mongoose");

// Invitation Schema
const invitatioSchema = new mongoose.Schema({
    from: {
        type: String,
    },
    to: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Rejected', 'Accepted'],
        default: 'Pending'
    },
});

mongoose.pluralize(null);
const Invitation = mongoose.model("Invitation", invitatioSchema);

module.exports = Invitation;