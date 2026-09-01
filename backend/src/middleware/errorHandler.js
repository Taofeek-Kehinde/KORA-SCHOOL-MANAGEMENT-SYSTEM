const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry found';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record not found';
  }

  if (err.code === '42703') {
    statusCode = 400;
    message = 'Invalid field name';
  }

  if (err.code === 'PGRST116') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    status: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details || null
    })
  });
};

module.exports = { errorHandler };