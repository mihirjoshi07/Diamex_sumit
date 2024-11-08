const mongoose=require("mongoose");
const messageSchema = new mongoose.Schema(
	{
        demandId:{type:mongoose.Schema.Types.ObjectId, ref:"Demand"},

		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Contact",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Contact",
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		senderDeleted:{
			type:Boolean,
			default:false
		},
		receiverDeleted:{
			type:Boolean,
			default:false
		},
		// createdAt, updatedAt
	},
	{ timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports=Message