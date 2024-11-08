const currencyModel = require("../models/currencyRates");
const cron = require('node-cron');
const demandModel = require("../models/demand");
const userModel = require("../models/User")
const notificationModel = require("../models/notification")
const currentDate = new Date();
//current date
const formattedDate = currentDate.toISOString().split('T')[0];


exports.createDemand = async (req, res) => {
    try {
        const userId = req.user; // Assuming `req.user` contains authenticated user's ID
        const demand = req.body;

        // Parse 'shape' and 'size' fields if they are JSON-encoded
        if (demand.shape && typeof demand.shape === 'string') {
            demand.shape = JSON.parse(demand.shape);  // Convert the JSON string back to an array
        }
        if (demand.size && typeof demand.size === 'string') {
            demand.size = JSON.parse(demand.size);    // Convert the JSON string back to an array
        }
        if (demand.color && typeof demand.color === 'string') {
            demand.color = JSON.parse(demand.color);    // Convert the JSON string back to an array
        }
        if (demand.intensity && typeof demand.intensity === 'string') {
            demand.intensity = JSON.parse(demand.intensity);    // Convert the JSON string back to an array
        }
        if (demand.clarity && typeof demand.clarity === 'string') {
            demand.clarity = JSON.parse(demand.clarity);    // Convert the JSON string back to an array
        }
        if (demand.Natts && typeof demand.Natts === 'string') {
            demand.Natts = JSON.parse(demand.Natts);    // Convert the JSON string back to an array
        }
        if (demand.Flourence && typeof demand.Flourence === 'string') {
            demand.Flourence = JSON.parse(demand.Flourence);    // Convert the JSON string back to an array
        }
        if (demand.Labs && typeof demand.Labs === 'string') {
            demand.Labs = JSON.parse(demand.Labs);    // Convert the JSON string back to an array
        }

        //setting expiry time days to date
        // demand.Expiry = new Date(Date.now() + Number(demand.Expiry) * 24 * 60 * 60 * 1000);
        // demand.Expiry = demand.Expiry.toISOString().split('T')[0];

        // Check if Expiry is sent as a number of days or as a full date string
        if (!isNaN(Number(demand.Expiry))) {
            // If Expiry is a number (days), calculate the future expiry date
            demand.Expiry = new Date(Date.now() + Number(demand.Expiry) * 24 * 60 * 60 * 1000);
        } else {
            // If Expiry is a full date string, ensure it's a valid Date object
            demand.Expiry = new Date(demand.Expiry);
        }
  
        if (isNaN(demand.Expiry.getTime())) {
            return res.status(400).json({ message: "Invalid Expiry date provided", success: false });
        }

        //setting postExpiryDate based on Expiry date
        let newDate = new Date(demand.Expiry);
        newDate = newDate.setDate(newDate.getDate() + 15);
        demand.postExpiryDate = newDate;

        //getting name and the profile picture
        const userData = await userModel.findOne({ userId: userId }).select("firstName profilePicture")
        console.log(userData.firstName)
        // Check if the demand data is present
        if (!demand) return res.status(400).json({ message: "Demand is empty.. please enter data", success: false });

        demand.userId = userId;
        console.log(req.file)

        // Check if files are uploaded correctly
        console.log("Uploaded Files:", req.files);

        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map(file => file.location);
            demand.imageUrl1 = imageUrls[0] || null; // Assign to imageUrl1
            demand.imageUrl2 = imageUrls[1] || null; // Assign to imageUrl2
            demand.imageUrl3 = imageUrls[2] || null; // Assign to imageUrl3
        } else {
            return res.status(400).json({ message: "File upload failed", success: false });
        }

        const newDemand = new demandModel(demand);
        const demandDoc = await newDemand.save();

        // Fetch all users except the one who created the demand
        const allUsers = await userModel.find({ userId: { $ne: userId } });
        console.log(allUsers)
        // Create notifications for each user
        const notifications = allUsers.map(user => {
            return new notificationModel({
                userId: user.userId,
                demandId: demandDoc._id,
                profilePic: userData.profilePicture,
            });
        });

        // Save notifications in bulk
        await notificationModel.insertMany(notifications);

        return res.status(201).json({ message: "Demand Created Successfully.. Notifications sent", success: true, demand: demandDoc });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to create Demand", success: false });
    }
};


exports.getAllNaturalDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "User not exists", success: false })
            const updatedDemand = await demandModel.updateMany(
                { Expiry: { $gt: formattedDate }, Type: "Natural" },
                { status: "Active" },
                { new: true }
            );
            const updatedDemandin = await demandModel.updateMany(
                { Expiry: { $lt: formattedDate }, Type: "Natural" },
                { status: "Inactive" },
                { new: true }
            );
        const allDemands = await demandModel.find({ userId: { $ne: userId }, Type: "Natural", Expiry: { $gte: formattedDate } }).sort({ fetchTime: -1 });
        return res.status(200).json({ demands: allDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demands", success: false });
    }
}

exports.getAllLabDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "User not exists", success: false })

            const updatedDemand = await demandModel.updateMany(
                { Expiry: { $gt: formattedDate }, Type: "Natural" },
                { status: "Active" },
                { new: true }
            );
            const updatedDemandin = await demandModel.updateMany(
                { Expiry: { $lt: formattedDate }, Type: "Natural" },
                { status: "Inactive" },
                { new: true }
            );

        const allDemands = await demandModel.find({ userId: { $ne: userId }, Type: "Lab Grown", Expiry: { $gte: formattedDate } }).sort({ fetchTime: -1 });
        return res.status(200).json({ demands: allDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demands", success: false });
    }
}


exports.getNaturalSpecificDemands = async (req, res) => {
    try {
        const userId = req.user;
        const { category } = req.params
        console.log(category)
        if (!userId) return res.status(400).json({ message: "User not exists", success: false })

        const demands = await demandModel.find({ userId: { $ne: userId }, category: category, Type: "Natural", Expiry: { $gte: formattedDate } }).sort({ fetchTime: -1 });

        return res.status(200).json({ demands: demands, category: category })
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demands", success: false });
    }
}



exports.getLabSpecificDemands = async (req, res) => {
    try {
        const userId = req.user;
        const { category } = req.params
        console.log(category)
        if (!userId) return res.status(400).json({ message: "User not exists", success: false })

        const demands = await demandModel.find({ userId: { $ne: userId }, category: category, Type: "Lab Grown", Expiry: { $gte: formattedDate } }).sort({ fetchTime: -1 });

        return res.status(200).json({ demands: demands, category: category })
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demands", success: false });
    }
}


exports.getDemandWithDollar = async (req, res) => {
    try {
    const userId = req.user;
    const demandId = req.params.id;
    if (!userId) return res.status(400).json({ message: "User not exists", success: false })

    const demand = await demandModel.findById(demandId);

    if (demand.price_ct_min[0] === '₹' && demand.price_ct_max[0] === '₹') {
        const _rate = await currencyModel.find().select("rate")
        let min = Math.floor(Number(demand.price_ct_min.slice(1,)) / _rate[0].rate);
        let max = Math.floor(Number(demand.price_ct_max.slice(1,)) / _rate[0].rate);

        demand.price_ct_min = `$${min.toString()}`;
        demand.price_ct_max = `$${max.toString()}`;
    }


    const user = await userModel.findOne({ userId: demand?.userId }).select("firstName lastName companyName profilePicture _id verificationStatus");

    return res.status(200).json({ demand: demand, user: user, success: true })

    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });
    }
}


exports.getDemandWithRupees = async (req, res) => {
    try {
        const userId = req.user;
        const demandId = req.params.id;
        if (!userId) return res.status(400).json({ message: "User not exists", success: false })

        const demand = await demandModel.findById(demandId);

        if (demand.price_ct_min[0] === '$' && demand.price_ct_max[0] === '$') {
            const _rate = await currencyModel.find().select("rate")
            let min = Math.floor(Number(demand.price_ct_min.slice(1,)) * _rate[0].rate);
            let max = Math.floor(Number(demand.price_ct_max.slice(1,)) * _rate[0].rate);

            demand.price_ct_min = `₹${min.toString()}`;
            demand.price_ct_max = `₹${max.toString()}`;
        }


        const user = await userModel.findOne({ userId: demand?.userId }).select("firstName lastName companyName profilePicture _id verificationStatus");
        return res.status(200).json({ demand: demand, user: user, success: true })

    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });
    }
}


exports.myNaturalDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "user not exists" })
        const updatedDemand = await demandModel.updateMany(
            { Expiry: { $gt: formattedDate }, userId: userId, Type: "Natural" },
            { status: "Active" },
            { new: true }
        );
        console.log(updatedDemand)
        const updatedDemandin = await demandModel.updateMany(
            { Expiry: { $lt: formattedDate }, userId: userId, Type: "Natural" },
            { status: "Inactive" },
            { new: true }
        );
        console.log(updatedDemandin)
        const myDemands = await demandModel.find({ userId: userId, Type: "Natural" }).sort({ fetchTime: -1 }).select("_id imageUrl1 imageUrl2 imageUrl3 category Cut shape status size clarity Expiry color cut userId fetchTime ");
        return res.status(200).json({ myDemands: myDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });

    }
}

exports.myLabDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "user not exists" })

        const updatedDemand = await demandModel.updateMany(
            { Expiry: { $gt: formattedDate }, userId: userId, Type: "Lab Grown" },
            { status: "Active" }
        );

        const updatedDemandin = await demandModel.updateMany(
            { Expiry: { $lt: formattedDate }, userId: userId, Type: "Lab Grown" },
            { status: "Inactive" }
        );
        const myDemands = await demandModel.find({ userId: userId, Type: "Lab Grown" }).sort({ fetchTime: -1 }).select("imageUrl1 imageUrl2 imageUrl3 category Cut shape status size clarity fetchTime Expiry color cut userId _id");
        return res.status(200).json({ myDemands: myDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });

    }
}


exports.myNaturalActiveDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "user not exists" })

        const updatedDemand = await demandModel.updateMany(
            { Expiry: { $gt: formattedDate }, userId: userId, Type: "Natural" },
            { status: "Active" }
        );
        console.log(updatedDemand)
        const myDemands = await demandModel.find({ userId: userId, Type: "Natural", Expiry: { $gte: formattedDate } }).sort({ fetchTime: -1 }).select("imageUrl shape Type size clarity color cut fetchTime userId _id status");

        return res.status(200).json({ myDemands: myDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });

    }
}

exports.myNaturalInactiveDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "user not exists" })

        const updatedDemand = await demandModel.updateMany(
            { Expiry: { $lt: formattedDate }, userId: userId, Type: "Natural" },
            { status: "Inactive" },
        );
        console.log(updatedDemand)

        const myDemands = await demandModel.find({ userId: userId, Type: "Natural", Expiry: { $lt: formattedDate } }).sort({ fetchTime: -1 }).select("imageUrl1 imageUrl2 imageUrl3 shape Type size clarity fetchTime color cut status userId _id");
        return res.status(200).json({ myDemands: myDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });

    }
}

exports.myLabActiveDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "user not exists" })

        const updatedDemand = await demandModel.updateMany(
            { Expiry: { $gt: formattedDate }, userId: userId, Type: "Lab Grown" },
            { status: "Active" }
        );
        console.log(updatedDemand)
        const myDemands = await demandModel.find({ userId: userId, Type: "Lab Grown", Expiry: { $gt: formattedDate } }).sort({ fetchTime: -1 }).select("imageUrl shape Type size clarity color cut fetchTime status userId _id");
        return res.status(200).json({ myDemands: myDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });

    }
}


exports.myLabInactiveDemands = async (req, res) => {
    try {
        const userId = req.user;
        if (!userId) return res.status(400).json({ message: "user not exists" })

        const updatedDemand = await demandModel.updateMany(
            { Expiry: { $lt: formattedDate }, userId: userId, Type: "Lab Grown" },
            { status: "Inactive" }
        );
        console.log(updatedDemand)
        const myDemands = await demandModel.find({ userId: userId, Type: "Lab Grown", Expiry: { $lt: formattedDate } }).sort({ fetchTime: -1 }).select("imageUrl shape Type size clarity color cut fetchTime status userId _id ");
        return res.status(200).json({ myDemands: myDemands, success: true });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch demand", success: false });

    }
}


exports.deleteDemand = async (req, res) => {
    try {
        const userId = req.user;
        const { id: demandId } = req.params;
        if (!userId || !demandId) return res.status(400).json({ message: "something went wrong", success: false });

        const deletedDemand = await demandModel.findOneAndDelete({ userId: userId, _id: demandId });
        console.log(deletedDemand)
        if (!deletedDemand) return res.status(400).json({ message: "You can only delete your demands", success: false });

        return res.status(200).json({ message: "demand deleted Successfully", success: true })
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete demand", success: false });
    }
}


exports.deleteDemands = async (req, res) => {
    try {
        const userId = req.user;
        const { demandIds } = req.body; // Expecting an array of demand IDs

        // Validate that demandIds is an array
        if (!Array.isArray(demandIds) || demandIds.length === 0) {
            return res.status(400).json({ message: "Invalid input: demandIds should be a non-empty array", success: false });
        }

        // Delete demands for the logged-in user
        const deletedDemands = await demandModel.deleteMany({ userId: userId, _id: { $in: demandIds } });
        console.log("Deleted demands count:", deletedDemands.deletedCount);

        // If no demands were deleted, return a message indicating that
        if (deletedDemands.deletedCount === 0) {
            return res.status(400).json({ message: "No demands deleted. Ensure you can only delete your demands.", success: false });
        }

        return res.status(200).json({ message: "Demands deleted successfully", success: true, count: deletedDemands.deletedCount });
    } catch (error) {
        console.error("Error deleting demands:", error);
        return res.status(500).json({ message: "Failed to delete demands", success: false });
    }
};


exports.refreshDemand = async (req, res) => {
    try {
        const userId = req.user;
        const { id: refreshId } = req.params;

        // Find the demand by userId and demandId
        const refreshDemand = await demandModel.findOne({ userId: userId, _id: refreshId });
        console.log("refreshDemand: ", refreshDemand);

        // Check if the demand exists
        if (!refreshDemand) {
            return res.status(400).json({ message: "Failed to refresh demand: Demand not found", success: false });
        }

        // Check if 24 hours have passed since the last refresh
        const lastFetchTime = new Date(refreshDemand.fetchTime);
        const currentTime = new Date();
        const timeDifference = currentTime - lastFetchTime;
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference < 24) {
            return res.status(400).json({ message: "You can only refresh this demand once every 24 hours", success: false });
        }

        // Update fetchTime
        const refreshTimeAdded = await demandModel.findOneAndUpdate(
            { _id: refreshDemand._id },
            { $set: { fetchTime: currentTime.toISOString() } },
            { new: true }
        );

        return res.json({ message: "Demand refreshed successfully", success: true, data: refreshTimeAdded });
    } catch (error) {
        console.error("Error refreshing demand:", error);
        return res.status(500).json({ message: "Failed to refresh demand", success: false });
    }
};

exports.refreshDemands = async (req, res) => {
    try {
        const userId = req.user;
        const { demandIds } = req.body; // Expecting an array of demand IDs

        if (!Array.isArray(demandIds) || demandIds.length === 0) {
            return res.status(400).json({ message: "Invalid input: demandIds should be a non-empty array", success: false });
        }

        // Find demands by userId and demandIds
        const refreshDemands = await demandModel.find({ userId: userId, _id: { $in: demandIds } });
        console.log("refreshDemands: ", refreshDemands);

        // Check if all provided demand IDs exist
        const existingDemandIds = refreshDemands.map(demand => demand._id.toString());
        const invalidDemandIds = demandIds.filter(id => !existingDemandIds.includes(id));

        // If there are invalid demand IDs, respond with a message
        if (invalidDemandIds.length > 0) {
            return res.status(400).json({
                message: "Invalid demand IDs found",
                invalidIds: invalidDemandIds,
                success: false
            });
        }

        // Filter demands that can be refreshed (only those that have a fetchTime older than 24 hours)
        const currentTime = new Date();
        const demandsToUpdate = refreshDemands.filter(demand => {
            const lastFetchTime = new Date(demand.fetchTime);
            const timeDifference = currentTime - lastFetchTime;
            const hoursDifference = timeDifference / (1000 * 60 * 60);
            return hoursDifference >= 24;
        });

        // If no demands are eligible for refresh
        if (demandsToUpdate.length === 0) {
            return res.status(400).json({
                message: "None of the demands can be refreshed yet. Please wait for 24 hours.",
                success: false
            });
        }

        // Update fetchTime for eligible demands
        const updatedDemands = await demandModel.updateMany(
            { _id: { $in: demandsToUpdate.map(demand => demand._id) } },
            { $set: { fetchTime: currentTime.toISOString() } }
        );

        return res.json({
            message: "Demands refreshed successfully",
            success: true,
            count: updatedDemands.modifiedCount
        });
    } catch (error) {
        console.error("Error refreshing demands:", error);
        return res.status(500).json({ message: "Failed to refresh demands", success: false });
    }
};



//This is a middleware
//this middleware is responsible to delete expired demands from the database after 15 days of expiring demand
exports.deleteExpiredDemands = async (req, res, next) => {
    try {
        const userId = req.user;
        const currentDate = new Date()
        console.log(currentDate)
        if (!userId) return res.status(400).json({ message: "something went wrong", success: false });

        const deletedDemands = await demandModel.deleteMany({ userId: userId, postExpiryDate: { $lte: currentDate } })
        console.log("Deleted Demands : ", deletedDemands)

        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal error", success: false });
    }
}


exports.filterDemands = async (req, res) => {
    try {
        const userId = req.user;
        const filterQuery = req.query;
        if (!userId || !filterQuery) return res.status(400).json({
            message: "Something went wrong",
            success: false
        });

        const query = {
            userId: { $ne: userId },
            Expiry: { $gt: formattedDate },
            ...(filterQuery.Type && { Type: filterQuery.Type }),
            ...(filterQuery.shape && { shape: { $in: filterQuery.shape.split(",") } }),
            ...(filterQuery.size && { size: { $in: filterQuery.size.split(",") } }),
            ...(filterQuery.color && { color: { $in: filterQuery.color.split(",") } }),
            ...(filterQuery.intensity && { intensity: { $in: filterQuery.intensity.split(",") } }),
            ...(filterQuery.clarity && { clarity: { $in: filterQuery.clarity.split(",") } }),
            ...(filterQuery.Cut && { Cut: filterQuery.Cut }),
            ...(filterQuery.price_ct_min && { price_ct_min: { $gte: filterQuery.price_ct_min } }),
            ...(filterQuery.price_ct_max && { price_ct_max: { $lte: filterQuery.price_ct_max } }),
            ...(filterQuery.Natts && { Natts: { $in: filterQuery.Natts.split(",") } }),
            ...(filterQuery.Location && { Location: filterQuery.Location }),
            // Added by me
            ...(filterQuery.BGM && { BGM: filterQuery.BGM }),

            ...(filterQuery.Note && { Note: filterQuery.Note }),
            ...(filterQuery.Terms && { Terms: filterQuery.Terms }),
            ...(filterQuery.mmL && { mmL: { $gte: filterQuery.mmL } }),
            ...(filterQuery.mmW && { mmW: { $gte: filterQuery.mmW } }),
            ...(filterQuery.Flourence && { Flourence: { $in: filterQuery.Flourence.split(",") } }),
            ...(filterQuery.Labs && { Labs: { $in: filterQuery.Labs.split(",") } }),
            // Added by me
            ...(filterQuery.category && { category: filterQuery.category }),
        };


        // Execute the query with MongoDB
        const results = await demandModel.find(query);
        if (!results) return res.status(404).json({
            message: "Demands not Matched",
            success: false
        });

        return res.status(200).json({
            results,
            success: true
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal error",
            success: false
        });
    }
};

// exports.filterDemands = async (req, res) => {
//     try {
//         const userId = req.user;
//         const filterQuery = req.body;
//         if (!userId || !filterQuery) return res.status(400).json({
//             message: "Something went wrong",
//             success: false
//         });

//         const query = {
//             userId: { $ne: userId },
//             Expiry: { $gt: formattedDate },
//             ...(filterQuery.Type && { Type: filterQuery.Type }),
//             ...(filterQuery.shape && { shape: { $in: filterQuery.shape } }),
//             ...(filterQuery.size && { size: { $in: filterQuery.size } }),
//             ...(filterQuery.color && { color: { $in: filterQuery.color } }),
//             ...(filterQuery.clarity && { clarity: filterQuery.clarity }),
//             ...(filterQuery.Cut && { Cut: filterQuery.Cut }),
//             ...(filterQuery.price_ct_min && filterQuery.price_ct_max && {
//                 price_ct_min: { $gte: filterQuery.price_ct_min },
//                 price_ct_max: { $lte: filterQuery.price_ct_max }
//             }),
//             ...(filterQuery.Natts && { Natts: filterQuery.Natts }),
//             ...(filterQuery.Location && { Location: filterQuery.Location }),
//             ...(filterQuery.BGM && { BGM: filterQuery.BGM }),
//             ...(filterQuery.Labs && { Labs: filterQuery.Labs }),
//             ...(filterQuery.mmL && { mmL: { $gte: filterQuery.mmL } }),
//             ...(filterQuery.mmW && { mmW: { $gte: filterQuery.mmW } }),
//             ...(filterQuery.Flourence && { Flourence:{$in: filterQuery.Flourence }}),
//             ...(filterQuery.category && { category: filterQuery.category })
//         };


//         // Execute the query with MongoDB
//         const results = await demandModel.find(query);
//         if(!results) return res.status(404).json({
//           message: "Demands not Matched",
//           success: false
//         });

//         return res.status(200).json({
//           results,
//           success: true
//         });
//     }
//     catch (error) {
//         res.status(500).json({
//             message: "Internal error",
//             success: false
//         });
//     }
// };


exports.filterMyDemands = async (req, res) => {
    try {
        const userId = req.user;
        const filterQuery = req.query;
        if (!userId || !filterQuery) return res.status(400).json({
            message: "Something went wrong",
            success: false
        });

        const query = {
            userId:userId ,
            ...(filterQuery.Type && { Type: filterQuery.Type }),
            ...(filterQuery.shape && { shape: { $in: filterQuery.shape.split(",") } }),
            ...(filterQuery.size && { size: { $in: filterQuery.size.split(",") } }),
            ...(filterQuery.color && { color: { $in: filterQuery.color.split(",") } }),
            ...(filterQuery.intensity && { intensity: { $in: filterQuery.intensity.split(",") } }),
            ...(filterQuery.clarity && { clarity: { $in: filterQuery.clarity.split(",") } }),
            ...(filterQuery.Cut && { Cut: filterQuery.Cut }),
            ...(filterQuery.price_ct_min && { price_ct_min: { $gte: filterQuery.price_ct_min } }),
            ...(filterQuery.price_ct_max && { price_ct_max: { $lte: filterQuery.price_ct_max } }),
            ...(filterQuery.Natts && { Natts: { $in: filterQuery.Natts.split(",") } }),
            ...(filterQuery.Location && { Location: filterQuery.Location }),
            // Added by me
            ...(filterQuery.BGM && { BGM: filterQuery.BGM }),

            ...(filterQuery.Note && { Note: filterQuery.Note }),
            ...(filterQuery.Terms && { Terms: filterQuery.Terms }),
            ...(filterQuery.mmL && { mmL: { $gte: filterQuery.mmL } }),
            ...(filterQuery.mmW && { mmW: { $gte: filterQuery.mmW } }),
            ...(filterQuery.Flourence && { Flourence: { $in: filterQuery.Flourence.split(",") } }),
            ...(filterQuery.Labs && { Labs: { $in: filterQuery.Labs.split(",") } }),
            // Added by me
            ...(filterQuery.category && { category: filterQuery.category }),
        };


        // Execute the query with MongoDB
        const results = await demandModel.find(query);
        if (!results) return res.status(404).json({
            message: "Demands not Matched",
            success: false
        });

        return res.status(200).json({
            results,
            success: true
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal error",
            success: false
        });
    }
};


exports.likeAndDislike = async (req, res) => {
    try {
        const userId = req.user;
        const { id: demandId } = req.params;

        if (!userId || !demandId) res.status(400).json({
            message: "Something Went Wrong",
            success: false
        });

        const demand = await demandModel.findById(demandId);
        console.log(demand)
        if (demand.userId.toString() === userId.toString())
            return res.status(400).json({
                message: "You cannot save your own demand",
                success: false
            });

        const result = await userModel.findOne({ userId });

        if (!result) res.status(400).json({
            message: "user not found",
            success: false
        });
        let action;
        if (result.likedDemands) {
            if (result.likedDemands.includes(demandId)) {
                result.likedDemands.pull(demandId)
                action = "DisLiked"
            }
            else {
                result.likedDemands.push(demandId)
                action = "Liked"
            }
        }
        await result.save();

        return res.status(200).json({
            message: `You ${action} a demand`,
            success: true
        });


    } catch (error) {
        console.error("Error in likeAndDislike:", error);
        res.status(500).json({
            message: "Internal Error",
            success: false
        });
    }
}



exports.getLikedDemands=async(req,res)=>{
    try {
        const userId=req.user;
        const updatedDemand = await demandModel.updateMany(
            { Expiry: { $gt: formattedDate }, Type: "Natural" },
            { status: "Active" },
            { new: true }
        );
        const updatedDemandin = await demandModel.updateMany(
            { Expiry: { $lt: formattedDate }, Type: "Natural" },
            { status: "Inactive" },
            { new: true }
        );
        const result=await userModel.findOne({userId}).select("likedDemands _id");

        // if(result.likedDemands.length ===0)
        //     res.status(404).json({
        //       message: "you have No liked demands",
        //       success: false
        //     });

        if (!result.likedDemands) {
            return res.status(404).json({
              message: "Liked demands not found for this user",
              success: false
            });
          }
      
          if (result.likedDemands.length === 0) {
            return res.status(404).json({
              message: "You have no liked demands",
              success: false
            });
          }

        const demandIds=result.likedDemands.map((demand)=>demand._id)
        const demands=await demandModel.find({userId:{$ne:userId},status:"Active",_id:{$in:demandIds}})
        return res.json(demands)

    } catch (error) {
        res.status(500).json({
          message: "Internal Error",
          success: false
        });
    }
}

// async function fetchAndStoreExchangeRate() {
//     try {
//         const response = await fetch(`${process.env.CURRENCY_API}`);
//         const data = await response.json();
//         const rate = data.rates.INR;  // Assuming the API returns a JSON with rates

//         // Create a new ExchangeRate document and save to database
//         const numRates = await currencyModel.countDocuments();

//         if (numRates === 0) {
//             const newRate = new currencyModel({
//                 rate: rate,
//             });
//             await newRate.save();
//         } else {
//             const updatedRate = await currencyModel.updateOne({ id: numRates._id }, { rate: rate })
//         }
//         console.log('Exchange rate updated:', rate);
//     } catch (error) {
//         console.error('Error fetching exchange rate:', error);
//     }
// }

// // Schedule the job to run every 12 hours
// cron.schedule('0 */12 * * *', () => {
//     console.log('Fetching and storing exchange rate...');
//     fetchAndStoreExchangeRate();
// });

// // Start the app
// fetchAndStoreExchangeRate();


