const mongoose=require("mongoose")

const optSchema=mongoose.Schema({
    phoneNumber:{type:String,required:true},
    otp:{type:String,required:true},
    createdAt:{type:Date , expires:'50m', default:Date.now}
})

const OTP = mongoose.model("OTP",optSchema)
module.exports=OTP;