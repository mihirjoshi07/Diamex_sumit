const multer = require("multer");
const multerS3 = require("multer-s3");
const dotenv = require('dotenv');
const { S3Client } = require("@aws-sdk/client-s3");

// Load environment variables
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

const myBucket = "daimex";

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: myBucket,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      let d = Date.now();
      cb(null, `demand-images/${d}-${file.originalname}`);
    }
  }),
  fileFilter: function (req, file, cb) {
    const fileTypes = /png|jpg|jpeg/;
    // const mimeType = fileTypes.test(file.mimetype); // Check MIME type
    // const extName = fileTypes.test(file.originalname.split('.').pop().toLowerCase()); // Check file extension

    const mimeType = fileTypes.test(file.mimetype) || file.mimetype === 'application/octet-stream'; // Allow 'application/octet-stream'
    const extName = fileTypes.test(file.originalname.split('.').pop().toLowerCase()); // Check file extension

    console.log('MIME type:', file.mimetype);
    console.log('File extension:', file.originalname.split('.').pop().toLowerCase());

    if (mimeType && extName) {
      return cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg, and .jpeg formats are allowed!"));
    }
  }
}).array('images', 3); // Accept up to 3 images


module.exports = upload;

