const multer = require('multer');
const sharp = require('sharp');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const allowedImageMimeTypes = allowedMimeTypes.filter((type) => type.startsWith('image/'));
const rawUploadMimeTypes = allowedMimeTypes.filter((type) => !type.startsWith('image/'));

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError('Only JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX, XLS, and XLSX files are allowed', 400));
    }
    cb(null, true);
  }
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (!allowedImageMimeTypes.includes(file.mimetype)) {
      return cb(new AppError('Only JPG, PNG, and WEBP image files are allowed', 400));
    }
    cb(null, true);
  }
});

function ensureCloudinaryConfigured() {
  if (!env.CLOUDINARY_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_SECRET) {
    throw new AppError('Cloudinary is not configured on the server. Please add Cloudinary environment variables.', 503);
  }
}

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    Readable.from(buffer).pipe(uploadStream);
  });
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function uploadToCloudinary(file) {
  ensureCloudinaryConfigured();

  const isImage = file.mimetype?.startsWith('image/');
  const isRawUpload = rawUploadMimeTypes.includes(file.mimetype);
  if (!isImage && !isRawUpload) {
    throw new AppError('Unsupported upload file type', 400);
  }

  const buffer = isRawUpload
    ? file.buffer
    : await sharp(file.buffer)
      .rotate()
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 76, effort: 4 })
      .toBuffer();

  const result = await uploadBufferToCloudinary(buffer, {
    folder: `salongo/${file.fieldname}`,
    resource_type: isRawUpload ? 'raw' : 'image'
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
  req.files = await uploadFilesObject(files);
  next();
});

const uploadAnyToCloudinary = asyncHandler(async (req, res, next) => {
  if (Array.isArray(req.files)) {
    req.files = await mapWithConcurrency(req.files, 3, uploadToCloudinary);
  }
  next();
});

async function uploadFilesObject(files = {}) {
  const entries = await Promise.all(Object.entries(files).map(async ([field, fieldFiles]) => {
    const uploaded = await mapWithConcurrency(fieldFiles, 3, uploadToCloudinary);
    return [field, uploaded];
  }));
  return Object.fromEntries(entries);
}

module.exports = {
  memoryFields: (fields) => multerUpload.fields(fields),
  uploadFieldsToCloudinary,
  uploadFilesObject,
  single: (fieldName) => [multerUpload.single(fieldName), uploadSingleToCloudinary],
  fields: (fields) => [multerUpload.fields(fields), uploadFieldsToCloudinary],
  any: () => [multerUpload.any(), uploadAnyToCloudinary],
  imageAny: () => [imageUpload.any(), uploadAnyToCloudinary]
};
