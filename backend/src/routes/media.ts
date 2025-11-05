import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { config } from '@/config/environment.js';
import { logger } from '@/utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), config.UPLOAD_DIR);
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed file types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'],
    video: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
  };

  const allAllowedTypes = [...allowedTypes.image, ...allowedTypes.audio, ...allowedTypes.video];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 50MB
    files: 5, // Maximum 5 files per request
  },
});

// Upload single file
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No File',
        message: 'No file was uploaded',
      });
    }

    const fileInfo = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.id,
      url: `/api/media/files/${req.file.filename}`,
    };

    logger.info(`File uploaded: ${req.file.originalname}`, {
      userId: req.user?.id,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: fileInfo,
    });

  } catch (error) {
    logger.error('File upload failed', { error, userId: req.user?.id });
    next(error);
  }
});

// Upload multiple files
router.post('/upload/multiple', upload.array('files', 5), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        error: 'No Files',
        message: 'No files were uploaded',
      });
    }

    const filesInfo = req.files.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.id,
      url: `/api/media/files/${file.filename}`,
    }));

    logger.info(`Multiple files uploaded: ${req.files.length} files`, {
      userId: req.user?.id,
      totalSize: req.files.reduce((sum, file) => sum + file.size, 0),
    });

    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      data: filesInfo,
    });

  } catch (error) {
    logger.error('Multiple file upload failed', { error, userId: req.user?.id });
    next(error);
  }
});

// Get file by filename
router.get('/files/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), config.UPLOAD_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'File Not Found',
        message: 'The requested file does not exist',
      });
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Set appropriate headers
    res.set({
      'Content-Length': stats.size.toString(),
      'Cache-Control': 'public, max-age=86400', // 1 day
    });

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    logger.error('File serve failed', { error, filename: req.params.filename });
    next(error);
  }
});

// Delete file
router.delete('/files/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), config.UPLOAD_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'File Not Found',
        message: 'The requested file does not exist',
      });
    }

    // Delete file
    await fs.unlink(filePath);

    logger.info(`File deleted: ${filename}`, { userId: req.user?.id });

    res.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    logger.error('File deletion failed', { error, filename: req.params.filename });
    next(error);
  }
});

// Get user's uploaded files
router.get('/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // In a real app, you would fetch files from database filtered by user ID
    // For now, return mock data
    const mockFiles = [
      {
        id: 'file_1',
        originalName: 'example-image.jpg',
        filename: 'example-image-123456789.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        url: '/api/media/files/example-image-123456789.jpg',
      },
      {
        id: 'file_2',
        originalName: 'sample-audio.mp3',
        filename: 'sample-audio-987654321.mp3',
        mimetype: 'audio/mpeg',
        size: 2048000,
        uploadedAt: new Date(Date.now() - 172800000).toISOString(),
        url: '/api/media/files/sample-audio-987654321.mp3',
      },
    ];

    res.json({
      success: true,
      data: {
        files: mockFiles,
        total: mockFiles.length,
      },
    });

  } catch (error) {
    logger.error('Failed to get user files', { error, userId: req.user?.id });
    next(error);
  }
});

export default router;