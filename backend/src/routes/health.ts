import express, { Request, Response } from 'express';

const router = express.Router();

// Health check endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Foto Video Creative Suite Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Detailed health check
router.get('/detailed', (_req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version,
    platform: process.platform,
  };

  try {
    res.json({
      success: true,
      data: healthCheck,
    });
  } catch (error) {
    healthCheck.message = 'ERROR';
    res.status(503).json({
      success: false,
      data: healthCheck,
    });
  }
});

export default router;