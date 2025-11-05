import express, { Request, Response } from 'express';
import { logger } from '@/utils/logger.js';

const router = express.Router();

// Get user profile
router.get('/profile', (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      },
    });

  } catch (error) {
    logger.error('Failed to get user profile', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile',
    });
  }
});

// Update user profile
router.put('/profile', (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { name, preferences } = req.body;

    // In a real app, you would update the user in the database
    // For now, just return success with updated data
    
    logger.info(`User profile updated: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          name: name || 'User',
          preferences: preferences || {},
          updatedAt: new Date().toISOString(),
        },
      },
    });

  } catch (error) {
    logger.error('Failed to update user profile', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user profile',
    });
  }
});

// Get user usage stats
router.get('/usage', (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // In a real app, you would fetch actual usage data from database
    const mockUsageData = {
      textGeneration: {
        totalRequests: 45,
        tokensUsed: 125000,
        thisMonth: 12,
      },
      imageGeneration: {
        totalRequests: 23,
        thisMonth: 8,
      },
      videoGeneration: {
        totalRequests: 5,
        thisMonth: 2,
      },
      audioGeneration: {
        totalRequests: 18,
        minutesGenerated: 45,
        thisMonth: 7,
      },
      subscription: {
        plan: 'free',
        usage: {
          textTokens: 125000,
          images: 23,
          videos: 5,
          audioMinutes: 45,
        },
        limits: {
          textTokens: 1000000,
          images: 100,
          videos: 20,
          audioMinutes: 120,
        },
      },
    };

    res.json({
      success: true,
      data: mockUsageData,
    });

  } catch (error) {
    logger.error('Failed to get user usage stats', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve usage statistics',
    });
  }
});

// Delete user account
router.delete('/account', (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // In a real app, you would:
    // 1. Mark user account for deletion
    // 2. Clean up user data
    // 3. Invalidate all tokens
    // 4. Send confirmation email

    logger.info(`User account deletion requested: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Account deletion request received. Your account will be deleted within 24 hours.',
    });

  } catch (error) {
    logger.error('Failed to process account deletion', { error, userId: req.user?.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process account deletion request',
    });
  }
});

export default router;