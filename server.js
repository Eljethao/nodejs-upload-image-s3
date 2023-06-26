const express = require('express');
const AWS = require('aws-sdk');
const uuid = require('uuid');
const app = express();
var bodyParser = require('body-parser');
const { region } = require('./config-aws');

require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Listening at port ${PORT}`));

AWS.config.update({ region: region });

const S3_BUCKET = process.env.AWS_BUCKET_NAME;
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: region,
    signatureVersion: "v4",
    //   useAccelerateEndpoint: true
});

const getPresignedUrl = (req, res) => {
    let fileType = req.body.fileType;
    if (fileType != ".jpg" && fileType != ".png" && fileType != ".jpeg") {
        return res
            .status(403)
            .json({ success: false, message: "Image format invalid" });
    }
    fileType = fileType.substring(1, fileType.length);
    const fileName = uuid.v4();
    const s3Params = {
        Bucket: S3_BUCKET,
        Key: "images/"+ fileName + "." + fileType,
        Expires: 60 * 60,
        ContentType: "image/" + fileType,
        ACL: "public-read",
    };

    s3.getSignedUrl("putObject", s3Params, (err, data) => {
        if (err) {
            console.log(err);
            return res.end();
        }
        const returnData = {
            success: true,
            message: "Url generated",
            uploadUrl: data,
            downloadUrl:
                `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}` + "." + fileType,
        };
        return res.status(201).json(returnData);
    });
}
app.post("/generatePresignedUrl", (req, res) => getPresignedUrl(req, res));