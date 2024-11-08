const express=require("express");
require("dotenv").config();
require("./mongoDbConnection");
const path=require("path")
const auth=require("./middleware/auth");
const isVerifiedUser=require("./middleware/isVerifiedUser");
const Contact = require("./models/contact"); // Adjust the path to your Contact model
// const cookieParser=require("cookie-parser");
const jwt=require("jsonwebtoken");
//initialize express
const {app,server}=require("./socket/socket");


//imports routes
const userRoutes=require("./routes/user");
const demandRoutes=require("./routes/demand");
const homeRoutes=require("./routes/home");
const feedbackRoutes=require("./routes/feedback");
const reportUser=require("./routes/report");
const conversationRoutes=require("./routes/conversation")


//middlewares
app.use(express.urlencoded({extended:true}))
app.use(express.json());// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
const {deleteExpiredDemands} = require("./controllers/demandController")
// app.use(cookieParser());


//routes middleware 
app.use("/user",userRoutes);
app.use("/demand",auth,deleteExpiredDemands,demandRoutes);
app.use("/home",homeRoutes);
app.use("/submitFeedback",feedbackRoutes);
app.use("/reportUser",reportUser);
// app.use("/conversation",conversationRoutes);
app.use("/conversation",auth,isVerifiedUser,conversationRoutes);




server.listen(process.env.PORT,()=>{
    console.log(`App is running on port ${process.env.PORT}`)
})

