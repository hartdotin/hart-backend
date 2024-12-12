const multer = require("multer");
const express = require("express");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const user = require("../model/user");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid"); // Use UUID for generating unique keys

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize the S3 client with AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post("/", upload.array("images", 4), async (req, res) => {
  const bucketName = "hart-user-photos";
  const region = process.env.AWS_REGION;
  const urls = [];
  try {
    for (const file of req.files) {
      const uniqueKey = `${uuidv4()}_${file.originalname}`; // Generate a unique key
      const params = {
        Bucket: bucketName,
        Key: uniqueKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Upload each file
      const uploadResult = await s3Client.send(new PutObjectCommand(params));

      // Add the S3 URL to the urls array
      const key = encodeURIComponent(uniqueKey);
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
      urls.push(url);
    }

    res.status(200).json({ message: "Files uploaded successfully", urls });
  } catch (err) {
    console.error("Error uploading files:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.post("/single", upload.array("images", 1), async (req, res) => {
  const bucketName = "hart-user-photos";
  const region = process.env.AWS_REGION;
  const urls = [];
  try {
    for (const file of req.files) {
      const uniqueKey = `${uuidv4()}_${file.originalname}`; // Generate a unique key
      const params = {
        Bucket: bucketName,
        Key: uniqueKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Upload each file
      const uploadResult = await s3Client.send(new PutObjectCommand(params));

      // Add the S3 URL to the urls array
      const key = encodeURIComponent(uniqueKey);
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
      urls.push(url);
    }

    res.status(200).json({ message: "Files uploaded successfully", urls });
  } catch (err) {
    console.error("Error uploading files:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});
module.exports = router;
