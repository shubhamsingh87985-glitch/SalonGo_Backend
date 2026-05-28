const { env } = require('../config/env');

module.exports = (error, req, res, next) => {
  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    return res.status(409).json({
      success: false,
      message: `${fields.join(', ') || 'Resource'} already exists`
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    details: error.details || undefined,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined
  });
};
