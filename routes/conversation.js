const express=require("express");
const auth=require("../middleware/auth");
const router=express.Router();
const {sendMessage,myDemandChats,getMySingleDemandChats,getMessages, marketDemandsChat, addDeleteFlag, deleteMessages}=require("../controllers/conversationController")

router.post("/send/:id",auth,sendMessage);
router.get("/mychats",auth,myDemandChats)
router.get("/getSingleDemandChats/:id",auth,getMySingleDemandChats)
router.get("/getMessages/:id",auth,getMessages)

router.delete("/deleteMessages",auth,deleteMessages)
router.get("/marketchats",auth,marketDemandsChat)
module.exports=router;

