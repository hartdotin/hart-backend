const multer = require('multer');
const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
require('dotenv').config();


const upload = multer({ storage: multer.memoryStorage() });

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();


router.post('/', upload.array('images', 4), (req, res) => {
    console.log('req', req.files)
    const uploadPromises = req.files.map(file => {
      const params = {
        Bucket: 'hart-user-photos',
        Key: `${file.originalname}`,
        Body: file.buffer
      };

      //console.log('params',params)
  
      return s3.upload(params).promise();
    });
  
    Promise.all(uploadPromises)
      .then(results => {
        //console.log(results)
        res.status(200).send(results);
      })
      .catch(err => {
        console.error('Error uploading files:', err);
        res.status(500).send(err);
    });
});

module.exports = router;

