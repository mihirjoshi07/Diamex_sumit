const express=require("express");
const router=express.Router();
const {createDemand, getAllNaturalDemands, getAllLabDemands, getNaturalSpecificDemands, getDemand, getLabSpecificDemands, myNaturalDemands,myLabDemands, myNaturalActiveDemands, myNaturalInactiveDemands, myLabActiveDemands, myLabInactiveDemands, deleteDemand, refreshDemand, sortDemands, filterDemands, filterMyDemands, getDemandWithDollar, getDemandWithRupees, refreshDemands, deleteDemands, likeAndDislike, getLikedDemands, }=require("../controllers/demandController");
const upload=require("../middleware/upload");


//sorted demands in descending order
// router.get("/sortedDemand",auth,sortDemands);

router.post("/createDemand", upload, createDemand);
router.get("/getNDemands",getAllNaturalDemands);
router.get("/getLabDemands",getAllLabDemands);
router.get("/getDemandWithDollar/:id",getDemandWithDollar);
router.get("/getDemandWithRupees/:id",getDemandWithRupees);

// filter parcel, single non certified , single certified 
router.get("/getFilterNDemands/:category",getNaturalSpecificDemands);
router.get("/getFilterLDemands/:category",getLabSpecificDemands);
router.get("/myNaturalDemands",myNaturalDemands);
router.get("/myLabDemands",myLabDemands);


//my active inactive demands
router.get("/myNaturalActiveDemands",myNaturalActiveDemands);
router.get("/myNaturalInactiveDemands",myNaturalInactiveDemands);

router.get("/myLabActiveDemands",myLabActiveDemands);
router.get("/myLabInactiveDemands",myLabInactiveDemands);

//filterDemands
router.get("/filterDemands",filterDemands);

//my filter demands
router.get("/filterMyDemands",filterMyDemands);

//Refresh single demand
router.put("/refreshDemand/:id",refreshDemand);
//Refresh mulitple demands
router.put("/refreshDemands",refreshDemands)


//delete single demand....
router.delete("/deleteDemand/:id",deleteDemand)
//delete multiple demands....
router.delete("/deleteDemands",deleteDemands)


//Liked and disliked
router.put("/likeAndDislike/:id",likeAndDislike);

//get liked demands
router.get("/getLikedDemands",getLikedDemands);

module.exports=router;  

