const jwt = require("jsonwebtoken");
const Contact = require("../models/contact"); 
require("dotenv").config();

const authorizedUser = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1];
    console.log("middleware called");
    if (!token) {
        return res.status(401).json({ message: "Token not found", success: false });
    }

    try {
        // Step 1: Verify the token and decode it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded jwt:",decoded)
        // Step 2: Find the user by ID and compare token versions
        const user = await Contact.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "from auth User not found", success: false });
        }

        // Step 3: Compare the tokenVersion from the JWT with the one in the database
        if (user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ message: "Token has been invalidated", success: false });
        }

        // Step 4: If everything checks out, proceed to the next middleware or route
        req.user = user._id; // Attach the user object to the request
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid access token", success: false });
    }
};

module.exports = authorizedUser;
