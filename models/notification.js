const mongoose=require("mongoose");

const notificationSchema=new mongoose.Schema({
    userId:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:"User",
        required:true
    },
   
    demandId:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:"Demand",
        required:true
    },
    profilePic:{type:String}
}, {timestamps:true})

module.exports=mongoose.model('Notification',notificationSchema);