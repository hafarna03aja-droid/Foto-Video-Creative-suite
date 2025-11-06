import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.js';
import { config } from '@/config/environment.js';

// Error tracking metrics
let errorMetrics = {
  total: 0,
  byStatus: {} as Record<number, number>,
  byType: {} as Record<string, number>,
  recent: [] as Array<{
    timestamp: string;
    status: number;
    message: string;
    url: string;
    method: string;
  }>
};

export const getErrorMetrics = () => errorMetrics;

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Enhanced error logging
  const errorContext = {
    errorId,
    timestamp,
    status: statusCode,
    message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params,
    query: req.query,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[PRESENT]' : '[NOT PRESENT]',
    },
    environment: config.NODE_ENV,
  };

  logger.error(`[${errorId}] Error occurred: ${message}`, errorContext);

  // Update metrics
  errorMetrics.total++;
  errorMetrics.byStatus[statusCode] = (errorMetrics.byStatus[statusCode] || 0) + 1;
  errorMetrics.byType[err.name || 'UnknownError'] = (errorMetrics.byType[err.name || 'UnknownError'] || 0) + 1;
  
  // Keep only recent 100 errors
  errorMetrics.recent.push({
    timestamp,
    status: statusCode,
    message,
    url: req.url,
    method: req.method
  });
  if (errorMetrics.recent.length > 100) {
    errorMetrics.recent = errorMetrics.recent.slice(-100);
  }

  // Handle specific error types with detailed responses
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      errorId,
      details: err.details || {},
      timestamp,
    });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      errorId,
      timestamp,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token Expired',
      message: 'Authentication token has expired',
      errorId,
      timestamp,
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File Too Large',
      message: 'Uploaded file exceeds size limit',
      errorId,
      timestamp,
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      error: 'File Not Found',
      message: 'Requested file does not exist',
      errorId,
      timestamp,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'Invalid resource identifier provided',
      errorId,
      timestamp,
    });
  }

  if (err.code === 11000) { // MongoDB duplicate key error
    return res.status(409).json({
      success: false,
      error: 'Duplicate Resource',
      message: 'Resource with this identifier already exists',
      errorId,
      timestamp,
    });
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: 'Cross-origin request blocked. Check your domain configuration.',
      errorId,
      timestamp,
    });
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    return res.status(429).json({
      success: false,
      error: 'Rate Limited',
      message: 'Too many requests. Please try again later.',
      errorId,
      timestamp,
      retryAfter: err.retryAfter || 60,
    });
  }

  // Default error response with enhanced information
  const isProduction = config.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message: isProduction && statusCode === 500 
      ? 'Something went wrong. Please try again or contact support.' 
      : message,
    errorId,
    timestamp,
    ...(statusCode === 500 && isProduction && { 
      supportMessage: 'If this error persists, please contact support with error ID: ' + errorId 
    }),
    ...(!isProduction && { 
      stack: err.stack,
      details: errorContext
    }),
  });
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  const errorId = `404_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.warn(`[${errorId}] Route not found: ${req.method} ${req.url}`, {
    errorId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    errorId,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'GET /api/health/detailed',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'POST /api/ai/generate/text',
      'POST /api/ai/generate/image',
    ]
  });
};