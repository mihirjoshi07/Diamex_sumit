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

// File filter to allow only .pdf files
const fileFilter = (req, file, cb) => {
    console.log("Uploaded File:", file.originalname, file.mimetype);
    const allowedTypes = /pdf/; // Only allow PDF files
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        req.fileValidationError = "Only PDF files are allowed!";
        cb(null, false); // Call cb with false to reject the file
    }
};

// Configure multer for S3 storage
const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: myBucket,
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            let d = Date.now();
            cb(null, `Verification-documents/${d}-${file.originalname}`); // Updated path for PDF files
        }
    }),
    fileFilter: fileFilter,
}).array('documents', 5); // Accept up to 4 PDF files

module.exports = upload;
