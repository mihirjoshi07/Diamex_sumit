const mongoose=require("mongoose");
const contactModel=require("../models/contact");

const reportSchema=new mongoose.Schema({
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Contact",
        validate: {
            validator: async function (value) {
                const userId = await contactModel.findById(value);
                return userId !== null;
            },
            message: "user ID does not exist"
        }
    },
    reportedUserId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Contact",
        validate: {
            validator: async function (value) {
                const userId = await contactModel.findById(value);
                return userId !== null;
            },
            message: "Reported user not exist"
        }
    },
    reportDescription:{type:String,require:true}
});

module.exports=mongoose.model("Report",reportSchema);