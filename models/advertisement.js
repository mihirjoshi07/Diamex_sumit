const mongoose = require("mongoose");

const AdvertisementSchema=new mongoose.Schema({
    phoneNumber:{type:String, required:true, unique:true},
    userName:{type:String},
    adImages:{type:[String]}
},{timestamps:true})

module.exports=mongoose.model("Advertisement",AdvertisementSchema);