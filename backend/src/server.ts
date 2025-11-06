import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/environment.js';
import { logger } from '@/utils/logger.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import { requestLogger } from '@/middleware/requestLogger.js';
import { authenticateToken } from '@/middleware/auth.js';
import { 
  responseTime, 
  requestSizeLimiter, 
  apiVersion, 
  corsPreflightCache,
  memoryCache 
} from '@/middleware/performance.js';

// Route imports
import authRoutes from '@/routes/auth.js';
import aiRoutes from '@/routes/ai.js';
import userRoutes from '@/routes/user.js';
import mediaRoutes from '@/routes/media.js';
import healthRoutes from '@/routes/health.js';

const app = express();

// Trust proxy for production deployment
if (config.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    },
  },
}));

// CORS configuration with preflight caching
app.use(corsPreflightCache(86400)); // 24 hours
app.use(cors({
  origin: config.CORS_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Performance middleware
app.use(responseTime);
app.use(requestSizeLimiter(50 * 1024 * 1024)); // 50MB limit
app.use(apiVersion('1.0.0'));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Routes with caching
app.use('/api/health', 
  memoryCache({ 
    ttl: 30, // 30 seconds cache for health checks
    condition: (req) => req.path === '/' || req.path === '/live'
  }), 
  healthRoutes
);
app.use('/api/auth', authRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/media', authenticateToken, mediaRoutes);

// Serve static files (for media uploads)
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true,
}));

// 404 handler for unmatched routes
app.use('*', notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = config.PORT || 3001;
  
  // Graceful shutdown for local development
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });

  app.listen(PORT, () => {
    logger.info(`🚀 Foto Video Creative Suite Backend running on port ${PORT}`);
    logger.info(`📝 Environment: ${config.NODE_ENV}`);
    logger.info(`🔒 CORS Origins: ${config.CORS_ORIGINS}`);
  });
}

export default app;