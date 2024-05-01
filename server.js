const express = require('express');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const app = express();
var bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Listening at port ${PORT}`));

AWS.config.update({ region: "ap-southeast-1" });

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: "ap-southeast-1",
    signatureVersion: "v4",
    //   useAccelerateEndpoint: true
});

const getPresignedUrl = async (req, res) => {
    try {
        let fileType = req.body.type;
        if (fileType != "image/jpg" && fileType != "image/png" && fileType != "image/jpeg") {
            return res
                .status(403)
                .json({ message: "INVALID_IMAGE_FORMAT" });
        }
        let _presignedUrl = await getSingedUrl(req.body.type);
        res.status(200).json(_presignedUrl);

    } catch (error) {
        console.log("error: ", error)
        return res.status(500).json({
            message: "INTERNAL_SERVER_ERROR",
            error: error.toString()
        })
    }
}

const getSingedUrl = async (fileType) => {

    let _splitFileType = fileType.split("/")

    let filename = `${uuidv4()}.${_splitFileType[1]}`

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: "images/" + filename,
        Expires: 60 * 5
    };
    try {
        const url = await new Promise((resolve, reject) => {
            s3.getSignedUrl('putObject', params, (err, url) => {
                err ? reject(err) : resolve(url);
            });
        });
        const baseURL = url.split('?')[0];
        return { url: baseURL, filename }
    } catch (err) {
        if (err) {
            res.status(500).json({ err });
        }
    }
}
app.post("/generatePresignedUrl", (req, res) => getPresignedUrl(req, res));