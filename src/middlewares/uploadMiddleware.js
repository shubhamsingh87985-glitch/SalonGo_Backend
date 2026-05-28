const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError('Only JPG, PNG, WEBP, and PDF files are allowed', 400));
    }
    cb(null, true);
  }
});

async function uploadToCloudinary(file) {
  const isPdf = file.mimetype === 'application/pdf';
  const buffer = isPdf
    ? file.buffer
    : await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

  const dataUri = `data:${isPdf ? file.mimetype : 'image/webp'};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `salongo/${file.fieldname}`,
    resource_type: isPdf ? 'raw' : 'image'
  });

  return {
    ...file,
    path: result.secure_url,
    filename: result.public_id,
    resource_type: result.resource_type
  };
}

const uploadSingleToCloudinary = asyncHandler(async (req, res, next) => {
  if (req.file) req.file = await uploadToCloudinary(req.file);
  next();
});

const uploadFieldsToCloudinary = asyncHandler(async (req, res, next) => {
  const files = req.files || {};
  const entries = await Promise.all(Object.entries(files).map(async ([field, fieldFiles]) => {
    const uploaded = await Promise.all(fieldFiles.map(uploadToCloudinary));
    return [field, uploaded];
  }));
  req.files = Object.fromEntries(entries);
  next();
});

module.exports = {
  single: (fieldName) => [multerUpload.single(fieldName), uploadSingleToCloudinary],
  fields: (fields) => [multerUpload.fields(fields), uploadFieldsToCloudinary]
};
