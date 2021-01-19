const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.cloudName,
  api_key: process.env.cloudKey,
  api_secret: process.env.cloudSecret
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gallery',
    allowedFormats: ['jpg', 'png'],
    filename: function (req, res, cb) {
      let fileName = res.originalname.split(".")
      return fileName[0]
      // format: async (req, file) => 'png', // supports promises as well
      // public_id: (req, file) => 'computed-filename-using-request',
    },
}});
 
const uploader = multer({ storage });
module.exports = uploader;