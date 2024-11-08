const conversationModel = require("../models/Conversation");
const messageModel = require("../models/message");
const demandModel = require("../models/demand");
const usermodel = require("../models/User");
const {io,getReceiverSocketId}=require("../socket/socket");


exports.sendMessage = async (req, res) => {
    try {
        const { message, demandId } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user;

        const isValidConversation = await demandModel.findById(demandId).select("userId");
        console.log("isvalid : ", isValidConversation)
        console.log("sender : ", senderId);
        console.log("ReceiverId : ", receiverId);
        if (senderId.toString() != isValidConversation.userId.toString() && receiverId.toString() != isValidConversation.userId.toString())
            return res.status(400).json({ message: "Not Valid conversation based on this demand", success: false });

        console.log("sender id : ", senderId);
        if (senderId.toString() === receiverId.toString())
            return res.status(400).json({ message: "You cannot send message to yourself" });
        let conversation = await conversationModel.findOne({ demandId, participants: { $all: [senderId, receiverId] } });

        if (!conversation) {
            conversation = await conversationModel.create({
                demandId,
                participants: [senderId, receiverId]
            });
        }

        const newMesssage = new messageModel({
            senderId,
            receiverId,
            message,
            demandId,
        });

        if (newMesssage)
            conversation.messages.push(newMesssage);

        await Promise.all([conversation.save(), newMesssage.save()])
        const socketId=getReceiverSocketId(receiverId);
        if(socketId)
            io.to(socketId).emit("newMessage",newMesssage);

        res.status(201).json(newMesssage)

    } catch (error) {
        return res.status(500).json({ error: "internal server error" });
    }

}

exports.myDemandChats = async (req, res) => {
    const loggedInUser = req.user;
    try {
        const myDemands = await demandModel.find({ userId: loggedInUser }).select("_id")
        console.log(myDemands)
        // const uniqueDemandIds = await conversationModel.distinct('demandId');
        const uniqueDemandIds = await conversationModel.distinct('demandId', {
            demandId: { $in: myDemands }
        });
        // const demandschat = await demandModel.find({ _id: uniqueDemandIds }).select("userId shape size color price_ct_min price_ct_max Note category imageUrl1")
        // Changed by me to show some different data
        const demandschat = await demandModel.find({ _id: uniqueDemandIds }).select("userId shape category size clarity color Cut imageUrl1 updatedAt")


        return res
            .status(200)
            .json({ DemandIDS: demandschat, success: true })
    } catch (error) {
        return res.status(500).json({ error: "internal server error" });

    }
}

// this function will be responsible to get all the conversation of a single demand send by diff users on same demand
exports.getMySingleDemandChats = async (req, res) => {
    const loggedInUser = req.user;
    const { id: demandId } = req.params;

    if (!demandId)
        return res.status(400).json({ message: "Demand does not exist", success: false });

    try {
        const conversations = await conversationModel.find({ demandId });

        // Fetch all the participants with their chat data
        const senderData = conversations.map((item) => ({
            senderId: item.participants[0],
            updatedAt: item.updatedAt,
            chatId: item._id
        }));

        const senderIds = senderData.map((data) => data.senderId);

        // Fetch user info for all senderIds
        const chatUsers = await usermodel.find({ userId: { $in: senderIds } })
            .select("userId firstName lastName profilePicture");

        // Merge senderData with corresponding user info
        const mergedData = senderData.map((data) => {
            const userInfo = chatUsers.find((user) => user.userId.toString() === data.senderId.toString());
            console.log("user info : ", userInfo);
            return {
                ...data,  // include senderId, updatedAt, chatId
                firstName: userInfo?.firstName,
                lastName: userInfo?.lastName,
                profilePicture: userInfo?.profilePicture
            };
        });

        // Wrap everything into a single object
        return res.status(200).json({
            success: true,
            data: mergedData // return merged data combining senderData and user info
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getMessages = async (req, res) => {
    try {
        const loggedInUser = req.user; // Get the logged-in user
        const { id: chatId } = req.params; // Get chatId from request parameters

        // Validate inputs
        if (!loggedInUser) {
            return res.status(401).json({ message: "Unauthorized access", success: false });
        }
        if (!chatId) {
            return res.status(400).json({ message: "Chat ID is required", success: false });
        }

        //fetch all messages
        let messages = await conversationModel.find({ _id: chatId }).populate("messages");
        messages = messages.map((item) => item.messages)
        messages = messages.flat()

        console.log(messages[0])
        console.log(loggedInUser)

        console.log(messages[1])
        console.log(loggedInUser)

        console.log(messages[2])
        console.log(loggedInUser)

        console.log(messages[3])
        console.log(loggedInUser)

        // Fetch messages based on chatId and deletion status
        const msgs = await messageModel.find({
            _id: { $in: messages.map(m => m._id) }, // Filter by the chat ID
            $or: [
                { senderId: loggedInUser, senderDeleted: false },
                { receiverId: loggedInUser, receiverDeleted: false }
            ]
        }).sort({ createdAt: 1 });

        // Return the messages in the response
        return res.status(200).json({ messages: msgs, success: true });


    } catch (error) {
        console.error('Error fetching messages:', error); // Log the error for debugging
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};



exports.marketDemandsChat = async (req, res) => {
    const loggedInUser = req.user;
    try {
        const marketDemands = await demandModel.find({ userId: { $ne: loggedInUser } }).select("_id")

        const marketChats = await conversationModel.find({ demandId: marketDemands })

        const myMarketChats = marketChats
            .filter((chat) => String(chat.participants[0]) === String(loggedInUser._id))

        const result = await conversationModel.find({
            _id: { $in: myMarketChats.map(chat => chat._id) }
        })
            .populate({
                path: 'demandId',
                select: 'shape size color price_ct_min price_ct_max Type clarity Cut category imageUrl1 imageUrl2 imageUrl3 userId'
            })
            .select('-participants -messages'); // Exclude fields you don't need from the Conversation document
        // const result=await demandModel.find({_id:{$in:myMarketChats.map(chat=> chat.demandId)}}).select("shape size color price_ct_min price_ct_max Type updatedAt category imageUrl");


        console.log(JSON.stringify(result, null, 2));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: "internal server error" });

    }
}



exports.deleteMessages = async (req, res) => {
    // try {
    const userId = req.user;
    const { messageIds } = req.body
    let messages = await messageModel.find({ _id: { $in: messageIds } });

    if (messages.length < 1)
        return res.status(404).json({
            message: "No message found",
            success: false
        });

    for (let message of messages) {
        if (message.senderId.toString() === userId.toString())
            message.senderDeleted = true;
        else if (message.receiverId.toString() === userId.toString())
            message.receiverDeleted = true;
        else continue;


        //if both sender and receiver deletes the messages, then it should be deleted from database....
        if (message.senderDeleted && message.receiverDeleted) {
            await messageModel.deleteOne({ _id: message._id });
        } else {
            await message.save();
        }

    }

    return res.status(200).json({
        message: "message(s) deleted successfully",
        success: true
    });

    // } catch (error) {
    //     res.status(500).json({
    //         message: "Internal Error",
    //         success: false
    //     });
    // }
}