import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '@/config/environment.js';
import { logger } from '@/utils/logger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});

// Interfaces
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// Helper functions
const generateTokens = (userId: string, email: string, role: string = 'user') => {
  const payload = { id: userId, email, role };
  
  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// Register endpoint
router.post('/register', authLimiter, async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, and name are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters long',
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide a valid email address',
      });
    }

    // Hash password
    const saltRounds = 12;
    // Hash password for database storage (unused in demo)
    await bcrypt.hash(password, saltRounds);

    // In a real app, you would save this to a database
    // For now, we'll simulate user creation
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userId, email);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userId,
          email,
          name,
          role: 'user',
        },
        accessToken,
        refreshToken,
      },
    });

  } catch (error) {
    logger.error('Registration failed', { error, email: req.body?.email });
    res.status(500).json({
      error: 'Registration Failed',
      message: 'An error occurred during registration',
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required',
      });
    }

    // In a real app, you would fetch user from database and compare password
    // For now, we'll simulate user authentication
    // This is just for demo - replace with actual database lookup
    if (email === 'demo@example.com' && password === 'password123') {
      const userId = 'user_demo_123';
      const { accessToken, refreshToken } = generateTokens(userId, email);

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: userId,
            email,
            name: 'Demo User',
            role: 'user',
          },
          accessToken,
          refreshToken,
        },
      });
    } else {
      logger.warn(`Failed login attempt for email: ${email}`);
      res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password',
      });
    }

  } catch (error) {
    logger.error('Login failed', { error, email: req.body?.email });
    res.status(500).json({
      error: 'Login Failed',
      message: 'An error occurred during login',
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request<{}, {}, RefreshTokenRequest>, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as any;
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    logger.info(`Token refreshed for user: ${decoded.email}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });

  } catch (error) {
    logger.warn('Token refresh failed', { error });
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Refresh Token Expired',
        message: 'Please log in again',
      });
    }

    res.status(403).json({
      error: 'Invalid Refresh Token',
      message: 'Please log in again',
    });
  }
});

// Logout endpoint (optional - for token blacklisting)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, just return success
    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({
      error: 'Logout Failed',
      message: 'An error occurred during logout',
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No Token',
        message: 'No authentication token provided',
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        },
      },
    });

  } catch (error) {
    logger.warn('Token verification failed', { error });
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Authentication token has expired',
      });
    }

    res.status(403).json({
      error: 'Invalid Token',
      message: 'Authentication token is invalid',
    });
  }
});

export default router;