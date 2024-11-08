const express=require("express");
const auth=require("../middleware/auth");
const router=express.Router();
const {reportUser} = require("../controllers/reportController")


router.post("/:id",auth,reportUser);


module.exports=router;

