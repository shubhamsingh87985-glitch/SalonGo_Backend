const multer = require('multer');
const { env } = require('../config/env');
const logger = require('../utils/logger');

function isCloudinaryError(error) {
  return error.http_code || error.name === 'Error' && error.message?.toLowerCase().includes('cloudinary');
}

module.exports = (error, req, res, next) => {
  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    return res.status(409).json({
      success: false,
      message: `${fields.join(', ') || 'Resource'} already exists`
    });
  }

  if (error instanceof multer.MulterError) {
    const messageByCode = {
      LIMIT_FILE_SIZE: 'One or more files are too large. Maximum file size is 5MB.',
      LIMIT_FILE_COUNT: 'Too many files uploaded. Maximum 10 files are allowed.',
      LIMIT_UNEXPECTED_FILE: `Unexpected file field: ${error.field}`
    };

    return res.status(400).json({
      success: false,
      message: messageByCode[error.code] || error.message
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: Object.values(error.errors || {}).map((item) => item.message)
    });
  }

  if (isCloudinaryError(error)) {
    logger.error(`Cloudinary upload failed: ${error.message}`);
    return res.status(502).json({
      success: false,
      message: 'Image upload service failed. Please try again.'
    });
  }

  if (/input buffer|unsupported image|invalid image|image/.test(error.message || '') && error.stack?.includes('sharp')) {
    return res.status(400).json({
      success: false,
      message: 'One or more selected images are invalid or unsupported.'
    });
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) logger.error(`${error.message}\n${error.stack || ''}`);

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && env.NODE_ENV === 'production' && !error.isOperational
      ? 'Internal server error'
      : error.message,
    details: error.details || undefined,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined
  });
};
