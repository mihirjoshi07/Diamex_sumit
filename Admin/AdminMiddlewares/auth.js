const jwt = require("jsonwebtoken");
const adminModel=require("../AdminModels/adminAuth");
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.adminjwt;
        
        if (!token) return res.status(401).json({ error: "unauthorized -  no token found" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) return res.status(401).json({ error: "Unautorized - invalid token" });

        const admin = await adminModel.findById(decoded.userId).select("-password");

        if (!admin) return res.status(404).json({ error: "user not found" });

        req.user = admin._id;
        next();
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = auth;