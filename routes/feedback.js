const express=require("express");
const auth=require("../middleware/auth");
const router=express.Router();
const feedBackImage=require("../middleware/feedbackImage");
const {storeFeedback} = require("../controllers/feedbackController")


router.post("/",auth,feedBackImage.single("file"),storeFeedback);
// router.post("/createDemand",auth,upload.single("file"),createDemand);


module.exports=router;

