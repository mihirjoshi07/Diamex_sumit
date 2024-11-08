const feedbackModel=require("../models/feedback");


exports.storeFeedback=async(req,res)=>{
    
    try {
        const userId=req.user;
        let feedback=req.body;
        if(!userId) return res.status(400).json({message:"Failed to submit feedback",success:false}) 
        
        feedback.userId=userId;
        
        if(req.file && req.file.location)
            feedback.feedbackimage=req.file.location;
        else{
            return res.status(400).json({ message: "File upload failed", success: false });
        }
        
        const newFeedback=new feedbackModel(feedback);
        const submittedFeedback=await newFeedback.save();

        return res.status(200).json({message:"Thank you for Submitting Feedback..",success:true});

    } catch (error) {
        return res.status(500).json({message:"Failed to submit feedback",success:false});
    }
    
}