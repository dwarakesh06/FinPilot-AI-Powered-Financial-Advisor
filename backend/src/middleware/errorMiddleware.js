/**
 * Express Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('SERVER ERROR LOG:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorMessage = err.message || 'Internal Server Error';

  if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    errorMessage = 'Invalid or missing CSRF token';
  }

  res.status(statusCode);

  res.json({
    success: false,
    error: errorMessage,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  errorHandler,
};
