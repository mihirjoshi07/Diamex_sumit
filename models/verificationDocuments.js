const mongoose = require("mongoose");
const Contact=require("./contact")


const DocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        unique:true,
        ref: "Contact",
        validate: {
            validator: async function (value) {
                const userId = await Contact.findById(value);
                return userId !== null;
            },
            message: "user ID does not exist"
        }
    },
    kyc_document: { type: String },
    gst_document: { type: String },
    trade_membership_document: { type: String },
    pan_card: { type: String },
    aadhar_dcoument: { type: String },
    //reference 1 details
    ref1_name: { type: String },
    ref1_company: { type: String },
    ref1_phoneNumber: { type: String },
    //reference 2 details
    ref2_name: { type: String },
    ref2_company: { type: String },
    ref2_phoneNumber: { type: String },
    //reference 3 details
    ref3_name: { type: String },
    ref3_company: { type: String },
    ref3_phoneNumber: { type: String },


})

module.exports = mongoose.model("Document", DocumentSchema);