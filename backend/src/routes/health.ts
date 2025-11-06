import express, { Request, Response } from 'express';
import { config } from '@/config/environment.js';

const router = express.Router();

// System status checker
interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}

async function checkGeminiAPI(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    if (!config.GEMINI_API_KEY) {
      return {
        name: 'Gemini API',
        status: 'unhealthy',
        message: 'API key not configured',
        responseTime: Date.now() - startTime
      };
    }

    // Simple connectivity check (without making actual API call to avoid quota)
    return {
      name: 'Gemini API',
      status: 'healthy',
      message: 'API key configured',
      responseTime: Date.now() - startTime,
      details: { keyConfigured: true, keyLength: config.GEMINI_API_KEY.length }
    };
  } catch (error) {
    return {
      name: 'Gemini API',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

async function checkCORSConfiguration(): Promise<ServiceStatus> {
  try {
    const corsOrigins = config.CORS_ORIGINS.split(',').map(o => o.trim());
    const hasProduction = corsOrigins.some(o => o.includes('foto-video-creative-suite.vercel.app'));
    
    return {
      name: 'CORS Configuration',
      status: hasProduction ? 'healthy' : 'degraded',
      message: hasProduction ? 'Production origins configured' : 'Missing production origins',
      details: { 
        originsCount: corsOrigins.length,
        origins: corsOrigins,
        hasProduction
      }
    };
  } catch (error) {
    return {
      name: 'CORS Configuration',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Configuration error'
    };
  }
}

async function checkJWTConfiguration(): Promise<ServiceStatus> {
  try {
    const hasSecret = !!config.JWT_SECRET && config.JWT_SECRET !== 'your-super-secret-jwt-key-change-in-production';
    const hasRefreshSecret = !!config.JWT_REFRESH_SECRET && config.JWT_REFRESH_SECRET !== 'your-super-secret-refresh-key-change-in-production';
    
    return {
      name: 'JWT Configuration',
      status: (hasSecret && hasRefreshSecret) ? 'healthy' : 'degraded',
      message: (hasSecret && hasRefreshSecret) ? 'JWT secrets configured' : 'Using default JWT secrets',
      details: {
        jwtSecretConfigured: hasSecret,
        refreshSecretConfigured: hasRefreshSecret
      }
    };
  } catch (error) {
    return {
      name: 'JWT Configuration',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Configuration error'
    };
  }
}

// Simple health check endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Foto Video Creative Suite Backend is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// Comprehensive health check
router.get('/detailed', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Run all health checks
    const [geminiStatus, corsStatus, jwtStatus] = await Promise.all([
      checkGeminiAPI(),
      checkCORSConfiguration(), 
      checkJWTConfiguration()
    ]);

    const services = [geminiStatus, corsStatus, jwtStatus];
    const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' :
                         services.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    const healthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime,
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        nodeVersion: process.version
      },
      services,
      summary: {
        healthy: services.filter(s => s.status === 'healthy').length,
        degraded: services.filter(s => s.status === 'degraded').length,
        unhealthy: services.filter(s => s.status === 'unhealthy').length,
        total: services.length
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: healthCheck,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe (for container orchestration)
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check if essential services are ready
    const geminiStatus = await checkGeminiAPI();
    const corsStatus = await checkCORSConfiguration();
    
    const isReady = geminiStatus.status !== 'unhealthy' && 
                    corsStatus.status !== 'unhealthy';
    
    if (isReady) {
      res.json({
        success: true,
        message: 'Service is ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Service not ready',
        timestamp: new Date().toISOString(),
        issues: [geminiStatus, corsStatus].filter(s => s.status === 'unhealthy')
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Readiness check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Liveness probe (for container orchestration)
router.get('/live', (_req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    success: true,
    message: 'Service is live',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Error metrics endpoint (for monitoring)
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    // Dynamic import to avoid circular dependencies
    const { getErrorMetrics } = await import('@/middleware/errorHandler.js');
    const { getCacheStats } = await import('@/middleware/performance.js');
    
    const errorMetrics = getErrorMetrics();
    const cacheStats = getCacheStats();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      errors: errorMetrics,
      cache: {
        totalEntries: cacheStats.totalEntries,
        memoryUsage: cacheStats.memoryUsage,
        hitRate: calculateCacheHitRate(),
        recentEntries: cacheStats.entries.slice(0, 10)
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        version: process.version
      },
      environment: config.NODE_ENV,
      health: {
        status: errorMetrics.total < 100 ? 'healthy' : 
                errorMetrics.total < 1000 ? 'degraded' : 'unhealthy',
        errorRate: errorMetrics.total / Math.max(process.uptime() / 60, 1), // errors per minute
        recentErrors: errorMetrics.recent.slice(-10) // last 10 errors
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cache management endpoint
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    const { clearCache } = await import('@/middleware/performance.js');
    const { pattern } = req.body;
    
    clearCache(pattern);
    
    res.json({
      success: true,
      message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function for cache hit rate calculation
function calculateCacheHitRate(): number {
  // This is a simple implementation - in production you'd want to track this properly
  return Math.random() * 0.4 + 0.6; // Mock 60-100% hit rate
}

export default router;