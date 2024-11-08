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
  const profileUpload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: myBucket, // The S3 bucket (in this case, daimex)
      acl: "public-read", // Set public-read ACL
      contentType: multerS3.AUTO_CONTENT_TYPE, // Automatically detect file content type
      key: function (req, file, cb) {
        let d = Date.now();
        // Store the file in the "demand-images" folder
        cb(null, `profilePicture/${d}-${file.originalname}`);
      }
    })
  });

  module.exports = profileUpload;
