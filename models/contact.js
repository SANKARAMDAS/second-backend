const mongoose = require("mongoose");
const validator = require("validator");

// Contact Schema
const ContactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        trim: true,
        required: true,
    },
    middleName: {
        type: String,
        trim: true,
    },
    lastName: {
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
    questions: {
        type: String,
        required: true,
    }
});

mongoose.pluralize(null);
const Contact = mongoose.model("Contact", ContactSchema);

module.exports = Contact;
