const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const env = require('../config/env');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Translate known Mongoose/MongoDB errors into clean, predictable API
  // errors instead of leaking DB internals to the client.
  if (err instanceof mongoose.Error.ValidationError) {
    error = ApiError.badRequest(
      'Validation failed',
      Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }))
    );
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid value for ${err.path}`);
  } else if (err.code === 11000) {
    // Duplicate key error
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value for: ${field}`);
  } else if (!(err instanceof ApiError)) {
    error = ApiError.internal(env.nodeEnv === 'production' ? 'Internal server error' : err.message);
  }

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error({ err }, 'Unhandled error');
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    details: error.details,
    ...(env.nodeEnv !== 'production' && error.statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
