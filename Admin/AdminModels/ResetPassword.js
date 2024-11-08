const mongoose=require("mongoose");


const ResetSchema=new mongoose.Schema({
    otp:{type:Number}    
},{timestamps:true})

module.exports=mongoose.model("ResetPasswordOtps",ResetSchema);