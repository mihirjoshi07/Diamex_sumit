const mongoose=require("mongoose");
require("dotenv").config();

const connectDB=()=>{
   
    mongoose.connect(process.env.MONGO_URI)
        .then(()=>{
            console.log("Database connected..")
        })
        .catch((error)=>{
            console.log(error);
        })
}
connectDB();

module.exports=connectDB;