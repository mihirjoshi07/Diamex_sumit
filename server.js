const express=require("express");
require("dotenv").config();
require("./mongoDbConnection");
const path=require("path")
const auth=require("./middleware/auth");
const isVerifiedUser=require("./middleware/isVerifiedUser");
const Contact = require("./models/contact"); // Adjust the path to your Contact model
const cookieParser=require("cookie-parser");
const jwt=require("jsonwebtoken");
const cors=require("cors");

//initialize express
const {app,server}=require("./socket/socket.js");

//imports routes
const userRoutes=require("./routes/user");
const demandRoutes=require("./routes/demand");
const homeRoutes=require("./routes/home");
const feedbackRoutes=require("./routes/feedback");
const reportUser=require("./routes/report");
const conversationRoutes=require("./routes/conversation")


//Admin Routes
const adminAuthRoutes=require("./Admin/AdminRoutes/auth");

//middlewares
app.use(cors({
    origin: 'http://localhost:3001', // Replace with your frontend URL
    credentials: true, // Allow credentials (cookies) to be sent
}));

app.use(express.urlencoded({extended:true}))
app.use(express.json());// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
const {deleteExpiredDemands} = require("./controllers/demandController")
app.use(cookieParser());



//routes middleware 
app.use("/user",userRoutes);
app.use("/demand",auth,deleteExpiredDemands,demandRoutes);
app.use("/home",homeRoutes);
app.use("/submitFeedback",feedbackRoutes);
app.use("/reportUser",reportUser);
app.use("/conversation",auth,isVerifiedUser,conversationRoutes);

//admin Route
app.use("/admin",adminAuthRoutes);


server.listen(process.env.PORT,()=>{
    console.log(`App is running on port ${process.env.PORT}`)
})

