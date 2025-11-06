import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.js';

interface CacheOptions {
  ttl: number; // Time to live in seconds
  key?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}

// Simple in-memory cache
const cache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl * 1000) {
      cache.delete(key);
    }
  }
}, 60000); // Clean every minute

export const memoryCache = (options: CacheOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if caching condition is met
    if (options.condition && !options.condition(req, res)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.key 
      ? options.key(req)
      : `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    // Check if we have cached data
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry) {
      const age = Math.floor((Date.now() - cachedEntry.timestamp) / 1000);
      if (age < cachedEntry.ttl) {
        logger.info(`Cache hit for key: ${cacheKey}, age: ${age}s`);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Age', age.toString());
        return res.json(cachedEntry.data);
      } else {
        cache.delete(cacheKey);
      }
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: options.ttl
        });
        logger.info(`Cached response for key: ${cacheKey}, ttl: ${options.ttl}s`);
        res.set('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
};

// Cache statistics
export const getCacheStats = () => {
  const now = Date.now();
  const stats = {
    totalEntries: cache.size,
    memoryUsage: process.memoryUsage(),
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((now - entry.timestamp) / 1000),
      ttl: entry.ttl,
      expired: (now - entry.timestamp) > entry.ttl * 1000
    }))
  };
  return stats;
};

// Clear cache
export const clearCache = (pattern?: string) => {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

// Response compression middleware
export const responseTime = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.url} - ${duration}ms`, {
        method: req.method,
        url: req.url,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
  });
  
  next();
};

// Request size limiter
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Request Too Large',
        message: `Request size ${contentLength} bytes exceeds limit of ${maxSize} bytes`,
        maxSize
      });
    }
    
    next();
  };
};

// API versioning middleware
export const apiVersion = (version: string) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('API-Version', version);
    res.set('X-API-Version', version);
    next();
  };
};

// CORS timing middleware
export const corsPreflightCache = (maxAge: number = 86400) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Max-Age', maxAge.toString());
    }
    next();
  };
};