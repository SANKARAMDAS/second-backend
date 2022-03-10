var mongoose = require("mongoose");
const validator = require("validator");

// Status Model
const adminSchema = new mongoose.Schema({
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
    role: {
        type: String,
        trim: true,
        required: true
    }
});


mongoose.pluralize(null);
const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
