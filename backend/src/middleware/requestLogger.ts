import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Override res.end to log when request completes
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0,
    };

    // Choose log level based on status code
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, logData);
    } else {
      logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, logData);
    }

    // Call original end method
    return originalEnd(chunk, encoding);
  };

  next();
};