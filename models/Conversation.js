const mongoose=require("mongoose");
const conversationSchema = new mongoose.Schema(
	{
        demandId:{type:mongoose.Schema.Types.ObjectId, ref:"Demand"},
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Contact",
			},
		],
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
				default: [],
			},
		],
	},
	{ timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports=Conversation;