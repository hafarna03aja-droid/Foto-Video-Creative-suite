import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment.js';
import { logger } from '@/utils/logger.js';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        iat: number;
        exp: number;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access Denied',
      message: 'No authentication token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = decoded;
    
    logger.debug(`User authenticated: ${decoded.email}`);
    next();
  } catch (error) {
    logger.warn(`Invalid token attempt from ${req.ip}`);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Authentication token has expired',
      });
    }
    
    return res.status(403).json({
      error: 'Invalid Token',
      message: 'Authentication token is invalid',
    });
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = decoded;
  } catch (error) {
    // If token is invalid, just continue without user
    logger.debug(`Optional auth failed: ${error}`);
  }

  next();
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'You must be logged in to access this resource',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};