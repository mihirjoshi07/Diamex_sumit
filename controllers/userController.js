const jwt = require("jsonwebtoken");
const userModel = require("../models/User");
const otpModel = require("../models/Otp");
const contactModel = require("../models/contact");
const demandModel = require("../models/demand")
const notificationModel = require("../models/notification")
const documentsModel = require("../models/verificationDocuments");
const twilio = require("twilio");
require("dotenv").config()

const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)

// exports.sendOtp = async (req, res) => {
//     const { phoneNumber } = req.body;
//     if (!phoneNumber) return res.status(400).json({ message: "Please Enter phone number", success: false });
//     const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
//     const respon = new otpModel({ phoneNumber, otp })
//     try {
//         await respon.save()
//         await client.messages.create({
//             body: `Your OTP is ${otp}`,
//             from: '16185075714',
//             to: phoneNumber
//         });
//         res.status(200).json({ message: "Otp sent successfully", success: true })
//     } catch (error) {
//         console.log("Failed to send otp ", error)
//         res.status(500).json({ message: "falied to send otp..", success: false });
//     }
// }

exports.sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: "Please Enter phone number", success: false });
    // const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
    const otp=1234;
    const respon = new otpModel({ phoneNumber, otp })
    try {
        await respon.save()
        // await client.messages.create({
        //     body: Your OTP is ${otp},
        //     from: '16185075714',
        //     to: phoneNumber
        // });
        res.status(200).json({ message: "Otp sent successfully", success: true })
    } catch (error) {
        console.log("Failed to send otp ", error)
        res.status(500).json({ message: "falied to send otp..", success: false });
    }
};


exports.verifyOtp = async (req, res) => {
    console.log(req.body);
    const { phoneNumber, otp } = req.body;
    try {
        if (!phoneNumber || !otp) {
            return res.status(400).json({ message: "Please enter phone number and the OTP", success: false });
        }

        const otpDoc = await otpModel.findOne({ otp, phoneNumber });


        if (otpDoc) {
            // Delete the OTP document after verification
            await otpModel.deleteOne({ _id: otpDoc.id });

            // Find the user by phone number or create a new one
            let contact = await contactModel.findOne({ phoneNumber });
            if (!contact) {
                contact = new contactModel({ phoneNumber });
            }

            // Increment token version for the user
            contact.tokenVersion = (contact.tokenVersion || 0) + 1;
            await contact.save();

            // Generate JWT with the updated token version
            const token = jwt.sign(
                {
                    phoneNumber,
                    userId: contact._id,
                    tokenVersion: contact.tokenVersion, // Include tokenVersion in the payload
                    timestamp: new Date().toISOString(),
                },
                process.env.JWT_SECRET,
                { expiresIn: '15d' }
            );



            return res
                .status(200)
                .json({ token, userId: contact._id, phoneNumber, success: true });
        } else {
            return res.status(400).json({ message: "Invalid OTP", success: false });
        }
    } catch (error) {
        console.error("Error in verifyOtp:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

exports.logout = (req, res) => {
    return res.status(200).json({ message: "Logged out successgully", success: true })
}

exports.createProfile = async (req, res) => {
    try {
        const { firstName, lastName, companyName, email, bio, location, address, preference, business_category } = req.body;
        const userId = req.user;
        console.log("user id : ", userId)
        // Check if all required fields are present
        if (!firstName || !lastName || !email || !location || !preference || !address, !business_category) {
            return res.status(400).json({ message: "Please enter all the required fields", success: false });
        }

        // Check if the email already exists
        const is_email = await userModel.findOne({ email });
        if (is_email) {
            return res.status(400).json({ message: "Email already exists! Please try another.", success: false });
        }
        if (req.file && req.file.location) {
            profilePicture = req.file.location; // `location` contains the full S3 URL
        } else {
            return res.status(400).json({ message: "File upload failed", success: false });
        }

        // Fetch the user from the Contact model using contactId
        const user = await contactModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }


        // Create the profile
        const profile = new userModel({
            userId,
            firstName,
            lastName,
            companyName,
            email,
            bio,
            location,
            address,
            preference,
            profilePicture,
            business_category
        });

        // Save the new profile
        await profile.save();
        return res.status(200).json({ data: profile, message: "Profile created successfully", success: true });

    } catch (error) {
        console.log(error);
        if (error.message === 'User profile already exists, You can edit it') {
            res.status(400).json({ error: error.message }); // Send proper error response
        } else {
            console.log(error);
            return res.status(500).json({ message: "Something went wrong", success: false });
        }
    }
}

exports.getUser = async (req, res) => {
    try {
        const userId = req.user;
        const findUser = req.params.id;
        console.log(userId, findUser)

        if (userId.toString() === findUser.toString()) return res.status(400).json({ message: "This profile is yours... you can view your profile in edit section", success: false })
        if (!userId) return res.status(400).json({ message: "user not exists", success: false });

        const user = await userModel.findOne({ userId: findUser }).select("firstName lastName bio email companyName address business_category profilePicture location userId _id");
        const demand = await demandModel.find({ userId: findUser }).select("imageUrl1 imageUrl2 imageUrl3 category shape Type size clarity color Cut _id")

        return res.status(200).json({ user: user, userDemand: demand, success: true });


    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch user", success: false });
    }
}

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user;

        if (!userId) return res.status(400).json({ message: "user not exists", success: false });

        const user = await userModel.findOne({ userId: userId })
        return res.status(200).json({ user: user, success: true });


    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch user", success: false });
    }
}

// exports.updateUserProfile = async (req, res) => {
//     try {
//         const userData = req.body;
//         const userId = req.user;

//         if (!userId || !userData) return res.status(400).json({ message: "Fail to update profile", success: true });
//         console.log("User Data:", userData);
//         console.log("User ID:", userId);

//         if (req.file && req.file.location) {
//             profilePicture = req.file.location; // `location` contains the full S3 URL
//             console.log("Profile:", profilePicture);
//         } else {
//             console.log("Profile 400:", req.file);
//             return res.status(400).json({ message: "File upload failed", success: false });
//         }
//         userData.profilePicture = req.file.location;

//         console.log("File:", req.file);
//         console.log("Body:", req.body);

//         const updatedUser = await userModel.updateOne({ userId: userId }, { $set: userData });

//         if (updatedUser.modifiedCount === 0)
//             return res.status(404).json({ message: "User not found or no changes made", success: false });

//         return res.status(200).json({ message: "User profile updated successfully", success: true });


//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Failed to fetch user", success: false });
//     }
// }
exports.updateUserProfile = async (req, res) => {
    try {
        const userData = req.body;
        const userId = req.user;

        if (!userId || !userData) {
            return res.status(400).json({ message: "Failed to update profile", success: false });
        }

        console.log("User Data:", userData);
        console.log("User ID:", userId);

        // Only update profile picture if a new file is uploaded
        if (req.file && req.file.location) {
            userData.profilePicture = req.file.location;
            console.log("New profile picture uploaded:", userData.profilePicture);
        } else {
            console.log("No new profile picture uploaded; keeping the existing one.");
        }

        // Update user data in the database
        const updatedUser = await userModel.updateOne({ userId: userId }, { $set: userData });

        if (updatedUser.modifiedCount === 0) {
            return res.status(404).json({ message: "User not found or no changes made", success: false });
        }

        return res.status(200).json({ message: "User profile updated successfully", success: true });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Failed to update profile", success: false });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user;
        let notifications = await notificationModel.find({ userId: userId }).lean();
        const demandIds = notifications.map((item) => {
            return item.demandId
        })
        let demandData = await demandModel.find({ _id: { $in: demandIds } }).lean().select(" _id shape size clarity color Cut createdAt")
        if (!demandData) return res.status(404).json({
            message: "No notifications found",
            success: false
        });

        const result = demandData.map((demand) => {
            const notification = notifications.find((notification) => notification.demandId.toString() === demand._id.toString())//find method end
            if (notification && notification.profilePic) {
                return {
                    ...demand,
                    profilePic: notification.profilePic
                }
            }
            return demand;
        })

        return res.status(200).json({
            result,
            success: true
        });
    } 
    catch (error) {
        res.status(500).json({
            message: "Internal Error",
            success: false
        });
    }
}


exports.deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await notificationModel.deleteMany({ userId: userId });

        if (result.deletedCount > 0) {
            return res.status(200).json({
                success: true,
                message: `${result.deletedCount} notification(s) deleted successfully.`
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "No notifications found to delete."
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.setVerificationDocuments = async (req, res) => {
    try {
        const userId = req.user;
        const {
            ref1_name,
            ref1_company,
            ref1_phoneNumber,
            ref2_name,
            ref2_company,
            ref2_phoneNumber,
            ref3_name,
            ref3_company,
            ref3_phoneNumber
        } = req.body;

        console.log(req.body);

        // Function to validate phone numbers are different
        const validateUniquePhoneNumbers = (phone1, phone2, phone3) => {
            return new Set([phone1, phone2, phone3]).size === 3; // Set will eliminate duplicates
        };

        // Validate references
        if (!validateUniquePhoneNumbers(ref1_phoneNumber, ref2_phoneNumber, ref3_phoneNumber)) {
            return res.status(400).json({ message: "Phone numbers must be different for each reference.", success: false });
        }
        const references = {
            userId,
            ref1_name,
            ref1_company,
            ref1_phoneNumber,
            ref2_name,
            ref2_company,
            ref2_phoneNumber,
            ref3_name,
            ref3_company,
            ref3_phoneNumber
        };


        if (!userId || !references) res.status(400).json({
            message: "Failed to upload documents",
            success: false
        });

        // Check for file validation errors
        if (req.fileValidationError) {
            return res.status(400).json({
                message: req.fileValidationError,
                success: false,
            });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded", success: false });
        }

        // Log the uploaded files for debugging
        console.log("Uploaded files: ", req.files);

        // Check if files were uploaded
        if (req.files && req.files.length > 0) {
            const docUrls = req.files.map(file => file.location);
            references.kyc_document = docUrls[0] || null;
            references.gst_document = docUrls[1] || null;
            references.trade_membership_document = docUrls[2] || null;
            references.pan_card = docUrls[3] || null;
            references.aadhar_dcoument = docUrls[4] || null;
        } else {
            return res.status(400).json({ message: "File upload failed", success: false });
        }

        const data = await documentsModel.create(references);
        const updatedUser = await userModel.findOneAndUpdate({ userId }, { verificationStatus: "pending" });
        if (!data || !updatedUser)
            res.status(400).json({
                message: "Failed to uplaod documents",
                success: false
            });


        return res.status(200).json({
            message: "Document Submitted",
            success: true
        });


    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
};
