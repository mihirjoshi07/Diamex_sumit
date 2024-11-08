const express=require("express");
const { Login, Logout, resetPassword, validateOtp } = require("../AdminControllers/auth");
const auth=require("../AdminMiddlewares/auth")
const {getUsers,getFeedbacks, getReports, getDocuments, changePassword, updateVerificationStatus, addAdvertisement, showAds, updateReportStatus, updateFeedbackStatus, deleteAd, deleteWholeAdvertisement, } =require("../AdminControllers/user");
const Advertisement = require("../AdminMiddlewares/advertisement");
const limiter=require("../AdminMiddlewares/rateLimit");
const router=express.Router();


router.get("/users",auth,getUsers);
router.get("/feedbacks",auth,getFeedbacks);
router.get("/reports",auth,getReports);
router.get("/documents",auth,getDocuments);
router.get("/showAds",auth,showAds);

router.post("/login",Login);
router.post("/AddAdvertisement",auth,Advertisement.single("file"),addAdvertisement);
router.post("/change-password",auth,changePassword);
router.put("/change-status/:id",auth,updateVerificationStatus);
router.put("/resolve-report/:id",auth,updateReportStatus);
router.put("/resolve-feedback/:id",auth,updateFeedbackStatus);

router.delete("/remove-ads/:id",auth,deleteAd);
router.delete("/deleteAd/:id",auth,deleteWholeAdvertisement);
router.get("/logout",Logout);

router.post("/resetPassword",limiter,resetPassword);
router.post("/ValidateOtp",validateOtp);

module.exports=router;