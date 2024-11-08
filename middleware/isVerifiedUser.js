const userModel=require("../models/User");
const isVerifiedUser = async (req, res, next) => {
    try {
        const userId=req.user;
        const user=await userModel.findOne({userId:userId}).select("-_id verificationStatus")
        if(user.verificationStatus!=="verified")
            return res.status(400).json({
              message: "You are not a Verified user, please submit the verification documents",
              success: false
            });
        next();
    } catch (error) {
        res.status(statusCode).json({
          message: "message",
          success: false
        });
    }
};

module.exports = isVerifiedUser;
