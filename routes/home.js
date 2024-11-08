const express=require("express");
const router=express.Router();
const {home, getAllAdvertisements}=require("../controllers/homeController");
const auth = require("../middleware/auth");

router.get("/",auth,home);
router.get("/get-advertisements",auth,getAllAdvertisements);

module.exports=router;

