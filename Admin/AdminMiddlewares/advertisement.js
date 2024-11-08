const multer = require("multer");
const multerS3 = require("multer-s3");
const dotenv = require('dotenv');
const { S3Client } = require("@aws-sdk/client-s3");

// Load environment variables
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION, // Ensure you specify the region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

const myBucket = "daimex";

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
      cb(null, true);
  } else {
      req.fileValidationError = "Only .jpg, .jpeg, and .png files are allowed!";
      cb(null, false); 
  }
};


const Advertisement = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: myBucket, 
    acl: "public-read", 
    contentType: multerS3.AUTO_CONTENT_TYPE, 
    key: function (req, file, cb) {
      let d = Date.now();
      cb(null, `Advertisement/${d}-${file.originalname}`);
    }
  }),
  fileFilter: fileFilter 
});

module.exports = Advertisement;
