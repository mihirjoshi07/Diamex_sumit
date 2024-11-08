const adminModel = require("../AdminModels/adminAuth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const resetPasswordModel = require("../AdminModels/ResetPassword");
const twilio = require("twilio");
require("dotenv").config()

const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)


exports.Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) res.status(400).json({
            message: "Please Enter both Email and Password",
            success: false
        });
        console.log(email);
        console.log(password)
        const admin = await adminModel.findOne({ email });
        const admins = await adminModel.find();
        console.log(admins)
        if (!admin) return res.status(400).json({
            message: "Username or Password is Incorrect...",
            success: false
        });

        const pswd = await bcrypt.compare(password, admin?.password);

        if (!pswd) return res.status(400).json({
            message: "Username or Password is Incorrect...",
            success: false
        });

        const token = jwt.sign({ userId: admin._id, timeStamp: Date.now() }, process.env.JWT_SECRET, {
            expiresIn: '10d'
        })

        res.cookie("adminjwt", token, {
            maxAge: 15 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        })
        return res.status(200).json({
            message: "Logged in Successfully",
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Error",
            success: false
        });
    }
}


exports.Logout = async (req, res) => {
    try {
        res.cookie("adminjwt", "", {
            maxAge: 0,
            httpOnly: true,
        })
        return res.status(200).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to logout",
            success: false
        });
    }
}


exports.resetPassword = async (req, res) => {

    const phoneNumber = "+916351557044"
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
    const respon = new resetPasswordModel({ otp })
    try {
        await respon.save()
        await client.messages.create({
            body: `Your OTP to reset password is ${otp}`,
            from: '12183047086',
            to: phoneNumber
        });
        res.status(200).json({ message: "Otp sent successfully", success: true })
    } catch (error) {
        console.log("Failed to send otp ", error)
        res.status(500).json({ message: "falied to send otp..", success: false });
    }
}


exports.validateOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const isValid = await resetPasswordModel.findOne({ otp: otp });
        if(!isValid) return res.status(400).json({
          message: "Invalid Otp",
          success: false
        });


        await resetPasswordModel.findOneAndDelete({otp:otp});

        const tempPassword=generateRandomPassword();
        const hashedPassword=await bcrypt.hash(tempPassword,10);
        
        const email="abc@gmail.com";
        await adminModel.updateOne({email},{password:hashedPassword});
        
        await client.messages.create({
            body: `Temporary password for Diamex Admin panel is  ${tempPassword}`,
            from: '12183047086',
            to: "+916351557044"
        });

        return res.status(200).json({
          message: "Temporary password has sent to your phone",
          hashedPassword,
          tempPassword,
          success: false
        });


    } catch (error) {
        res.status(500).json({
          message: "Internal Server Error",
          success: false
        });
    }

}


function generateRandomPassword(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
    
    return password;
  }