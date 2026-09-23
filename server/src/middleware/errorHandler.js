/**
 * Centralized error-handling middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}

