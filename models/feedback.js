const mongoose=require("mongoose");
const contactModel=require("../models/contact");
const feedbackSchema=new mongoose.Schema({
    userId: {
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
    feedbackimage:{type:String},
    description:{type:String}

})

module.exports=mongoose.model("Feedback",feedbackSchema);