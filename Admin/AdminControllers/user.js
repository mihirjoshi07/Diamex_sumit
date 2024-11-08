const userModel = require("../../models/User");
const feedbackModel = require("../../models/feedback");
const reportModel = require("../../models/report");
const documentModel = require("../../models/verificationDocuments");
const adminModel = require("../AdminModels/adminAuth");
const bcrypt = require("bcryptjs");
const advertisementModel = require("../../models/advertisement");

exports.getUsers = async (req, res) => {
    try {
        const users = await userModel.find().populate("userId", "phoneNumber").select(" -updatedAt -__v -notifications -likedDemands");
        const result = users.map((user) => {
            const { _id, ...rest } = user.toObject();
            return { id: _id, ...rest }
        })

        if (!result)
            return res.status(404).json({
                message: "No user found",
                success: false
            });

        return res.status(200).json({ result });
    } catch (error) {
        res.status(400).json({
            message: "Internal Error",
            success: false
        });
    }
}

exports.getFeedbacks = async (req, res) => {
    try {
    const feedbacks = await feedbackModel.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "userId",
                as: "userDetails"
            }
        },
        {
            $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true
            }
        }
    ])
    const result = feedbacks.map((feedback) => ({
        id: feedback._id,
        userId: feedback.userId,
        userName: feedback.userDetails?.firstName,
        description: feedback.description,
        feedbackimage: feedback.feedbackimage,
        status: feedback.status,
        createdAt: feedback.createdAt

    }))
    console.log(result)

    if (!result)
        return res.status(404).json({
            message: "No user found",
            success: false
        });

    return res.status(200).json({
        result,
        success: true
    });
    } catch (error) {
        res.status(400).json({
            message: "Internal Error",
            success: false
        });
    }
}



exports.getReports = async (req, res) => {
    try {
        const reports = await reportModel.aggregate([
            {
                $lookup: {
                    from: "users",               // The collection to join for user details
                    localField: "userId",        // Field from reportModel
                    foreignField: "userId",      // Field from users collection
                    as: "userDetails"            // The output array field
                }
            },
            {
                $lookup: {
                    from: "users",               // The collection to join for reported user details
                    localField: "reportedUserId", // Field from reportModel
                    foreignField: "userId",      // Field from users collection
                    as: "reportedUserDetails"     // The output array field
                }
            },
            {
                $unwind: {
                    path: "$userDetails",        // Unwind the userDetails array
                    preserveNullAndEmptyArrays: true // Keep documents even if userDetails is empty
                }
            },
            {
                $unwind: {
                    path: "$reportedUserDetails", // Unwind the reportedUserDetails array
                    preserveNullAndEmptyArrays: true // Keep documents even if reportedUserDetails is empty
                }
            }
        ]);

        // Populates the reportedUserId with only the firstName field
        if (!reports.length) {
            return res.status(200).json({
                message: "No reports found",
                success: false
            });
        }

        const result = reports.map((report) => ({
            id: report._id,
            userId: report.userId,
            reportedUserId: report.reportedUserId,
            reportDescription: report.reportDescription,
            status: report.status,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            userName: report.userDetails?.firstName,
            reportedUserName: report.reportedUserDetails.firstName
        }));


        if (result.length === 0) {
            return res.status(404).json({
                message: "No reports found",
                success: false
            });
        }

        return res.status(200).json({
            result,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal Error",
            success: false
        });
    }
};



exports.getDocuments = async (req, res) => {
    try {
        const documents = await documentModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "userId",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    "userDetails.__v": 0,
                    __v: 0,
                }
            },
            {
                $addFields: {
                    verificationStatus: "$userDetails.verificationStatus"
                }
            },
            {
                $project: {
                    userDetails: 0
                }
            }
        ]);

        const result = documents.map((document) => {
            const { _id, ...rest } = document;
            return { id: _id, ...rest }
        })

        if (!result)
            return res.status(404).json({
                message: "No user found",
                success: false
            });

        return res.status(200).json({
            result,
            success: true
        });
    } catch (error) {
        res.status(400).json({
            message: "Internal Error",
            success: false
        });
    }
}

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user;
        const saltRounds = 10;
        const admin = await adminModel.findById(userId);
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!admin) {
            return res.status(404).json({
                message: "User Not Found",
                success: false
            });
        }

        const pswdMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!pswdMatch) {
            return res.status(400).json({
                message: "Old password is incorrect",
                success: false
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New password and confirm password should match.",
                success: false
            });
        }

        if (newPassword === oldPassword) {
            return res.status(400).json({
                message: "New password should be different than old password... ",
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        const result = await adminModel.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });

        if (!result) {
            return res.status(400).json({
                message: "Failed to update password",
                success: false
            });
        }

        res.status(200).json({
            message: "Password successfully updated",
            success: true
        });

    } catch (error) {
        console.error("Error changing password:", error.message);  // Log the error for debugging
        res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
}

exports.updateVerificationStatus = async (req, res) => {
    try {
        const admin = req.user;
        const userId = req.params.id;

        const { status } = req.body;
        console.log(userId);
        console.log(status);
        if (!admin) return res.status(400).json({
            message: "Please login before this operation",
            success: false
        });

        const updatedUser = await userModel.findOneAndUpdate({ userId: userId }, { verificationStatus: status });
        if (!updatedUser) return res.status(400).json({
            message: "Failed to update status",
            success: false
        });

        return res.status(200).json({
            message: "Status updated",
            success: true
        });


    } catch (error) {
        res.status(200).json({
            message: "Failed to update status",
            success: false
        });
    }
}


exports.addAdvertisement = async (req, res) => {
    try {
        const admin = req.user;
        if (!admin) {
            return res.status(400).json({
                message: "Unauthorized User",
                success: false
            });
        }

        const { phoneNumber, userName } = req.body;

        if (req.fileValidationError) {
            return res.status(400).json({
                message: req.fileValidationError,
                success: false,
            });
        }

        let advertisement = await advertisementModel.findOne({ phoneNumber: phoneNumber });

        if (req.file && req.file.location) {
            const imgUrl = req.file.location;

            if (advertisement) {
                advertisement.adImages.push(imgUrl);
            } else {
                advertisement = new advertisementModel({
                    phoneNumber,
                    userName,
                    adImages: [imgUrl]
                });
            }
            await advertisement.save();

            return res.status(200).json({
                message: "Advertisement added successfully!",
                success: true
            });
        } else {
            return res.status(400).json({
                message: "File upload failed",
                success: false
            });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to add advertisement",
            success: false
        });
    }
};


exports.showAds = async (req, res) => {
    try {
        const admin = req.user;
        if (!admin) {
            return res.status(401).json({
                message: "Unauthorized User",
                success: false
            });
        }

        const ads = await advertisementModel.find();
        const result = ads.map((ad) => {
            return {
                id: ad._id,
                userName: ad.userName,
                phoneNumber: ad.phoneNumber,
                adImages: ad.adImages,
                createdAt: ad.createdAt,
                updatedAt: ad.updatedAt
            };
        });

        if (result.length === 0) {
            return res.status(200).json({
                message: "No Ads found",
                success: false
            });
        }

        return res.status(200).json({
            result,
            success: true
        });
    } catch (error) {
        console.error("Error fetching ads:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
}


exports.updateReportStatus = async (req, res) => {
    try {
        const admin = req.user;
        const reportId = req.params.id;

        const { status } = req.body;
        console.log(reportId);
        console.log(status);
        if (!admin) return res.status(400).json({
            message: "Please login before this operation",
            success: false
        });

        const updatedUser = await reportModel.findOneAndUpdate({ _id: reportId }, { status: status });
        if (!updatedUser) return res.status(400).json({
            message: "Failed to update status",
            success: false
        });

        return res.status(200).json({
            message: "Status updated",
            success: true
        });


    } catch (error) {
        res.status(200).json({
            message: "Failed to update status",
            success: false
        });
    }
}



exports.updateFeedbackStatus = async (req, res) => {
    try {
        const admin = req.user;
        const feedbackId = req.params.id;

        const { status } = req.body;
        console.log(feedbackId);
        console.log(status);
        if (!admin) return res.status(400).json({
            message: "Please login before this operation",
            success: false
        });

        const updatedUser = await feedbackModel.findOneAndUpdate({ _id: feedbackId }, { status: status });
        if (!updatedUser) return res.status(400).json({
            message: "Failed to update status",
            success: false
        });

        return res.status(200).json({
            message: "Status updated",
            success: true
        });


    } catch (error) {
        res.status(200).json({
            message: "Failed to update status",
            success: false
        });
    }
}


exports.demo = async (req, res) => {
    try {
        const result = await reportModel.aggregate([
            {
                $lookup: {
                    from: "users",               // The collection to join for user details
                    localField: "userId",        // Field from reportModel
                    foreignField: "userId",      // Field from users collection
                    as: "userDetails"            // The output array field
                }
            },
            {
                $lookup: {
                    from: "users",               // The collection to join for reported user details
                    localField: "reportedUserId", // Field from reportModel
                    foreignField: "userId",      // Field from users collection
                    as: "reportedUserDetails"     // The output array field
                }
            },
            {
                $unwind: {
                    path: "$userDetails",        // Unwind the userDetails array
                    preserveNullAndEmptyArrays: true // Keep documents even if userDetails is empty
                }
            },
            {
                $unwind: {
                    path: "$reportedUserDetails", // Unwind the reportedUserDetails array
                    preserveNullAndEmptyArrays: true // Keep documents even if reportedUserDetails is empty
                }
            }
        ]);

        console.log(result);
        res.json(result); // Send the result as JSON response
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};




exports.deleteAd = async (req, res) => {
    try {
        const advertisementId = req.params.id;
        const { advertisementUrl } = req.body;
        console.log(advertisementId);
        console.log(advertisementUrl);

        let findDocument = await advertisementModel.findById({ _id: advertisementId });
        if (!findDocument) return res.status(404).json({
            message: "Advertisement not found",
            success: false
        });

        findDocument.adImages.pull(advertisementUrl);
        findDocument.save();

        return res.status(200).json({
            message: "Ad Deleted",
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}


exports.deleteWholeAdvertisement = async (req, res) => {
    try {
        const advertisementId = req.params.id;
        console.log(advertisementId)
        const result = await advertisementModel.findOneAndDelete({ _id:advertisementId });

        if (!result) {
            return res.status(404).json({
                message: "Advertisement not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Advertisement deleted successfully",
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
};
