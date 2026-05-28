const cloudinary = require('cloudinary').v2;
const { env } = require('./env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_SECRET,
  secure: true
});

module.exports = cloudinary;
