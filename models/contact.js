const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    tokenVersion: { type: Number, default: 0 } // Add tokenVersion field with default value 0
});

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
