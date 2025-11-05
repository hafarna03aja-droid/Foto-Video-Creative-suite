import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Error occurred: ${err.message}`, {
    error: err,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || {},
    });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Authentication token has expired',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File Too Large',
      message: 'Uploaded file exceeds size limit',
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'File Not Found',
      message: 'Requested file does not exist',
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message: process.env.NODE_ENV === 'production' && statusCode === 500 
      ? 'Something went wrong' 
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};