const reportModel=require("../models/report");

exports.reportUser=async(req,res)=>{
    try {
            const userId=req.user;
            const reportedUserId=req.params.id;
            let report=req.body;

            if(userId.toString()===reportedUserId.toString()) return res.status(400).json({message:"You cannot report yourself",success:false})
            
            if(!userId || !reportedUserId) return json({message:"Failed to report user ", success:false});

            report.userId=userId;
            report.reportedUserId=reportedUserId;

            const newReport=new reportModel(report);
            await newReport.save();

            return res.status(200).json({message:"Reported successfully",success:true});

    } catch (error) {
        return res.status(500).json({message:"Failed to report user ", success:false});
    }
}