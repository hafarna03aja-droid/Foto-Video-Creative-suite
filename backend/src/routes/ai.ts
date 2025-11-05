import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config/environment.js';
import { logger } from '@/utils/logger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// Rate limiting for AI endpoints (more restrictive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many AI requests, please try again later.',
  },
});

router.use(aiLimiter);

// Text Generation
router.post('/text/generate', async (req, res, next) => {
  try {
    const { prompt, maxTokens = 1000, temperature = 0.7 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Prompt is required',
      });
    }

    logger.info(`Text generation request from user ${req.user?.email}`, {
      promptLength: prompt.length,
      maxTokens,
      temperature,
    });

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    res.json({
      success: true,
      data: {
        text,
        promptTokens: prompt.length, // Approximate
        completionTokens: text.length, // Approximate
      },
    });

  } catch (error) {
    logger.error('Text generation failed', { error, userId: req.user?.id });
    next(error);
  }
});

// Image Generation
router.post('/image/generate', async (req, res, next) => {
  try {
    const { prompt, aspectRatio = '1:1', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Prompt is required',
      });
    }

    logger.info(`Image generation request from user ${req.user?.email}`, {
      prompt,
      aspectRatio,
      quality,
    });

    // For now, return a placeholder response since Gemini doesn't directly support image generation
    // This would typically integrate with DALL-E, Midjourney, or Stable Diffusion
    res.json({
      success: true,
      message: 'Image generation feature coming soon',
      data: {
        prompt,
        aspectRatio,
        quality,
        placeholder: `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(prompt.substring(0, 50))}`,
      },
    });

  } catch (error) {
    logger.error('Image generation failed', { error, userId: req.user?.id });
    next(error);
  }
});

// Video Generation
router.post('/video/generate', async (req, res, next) => {
  try {
    const { prompt, duration = 5, quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Prompt is required',
      });
    }

    logger.info(`Video generation request from user ${req.user?.email}`, {
      prompt,
      duration,
      quality,
    });

    // Placeholder for video generation - would integrate with video AI services
    res.json({
      success: true,
      message: 'Video generation feature coming soon',
      data: {
        prompt,
        duration,
        quality,
        placeholder: 'Video generation will be available soon',
      },
    });

  } catch (error) {
    logger.error('Video generation failed', { error, userId: req.user?.id });
    next(error);
  }
});

// Audio/Speech Generation
router.post('/audio/generate', async (req, res, next) => {
  try {
    const { text, voice = 'default', speed = 1.0, language = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text is required',
      });
    }

    logger.info(`Audio generation request from user ${req.user?.email}`, {
      textLength: text.length,
      voice,
      speed,
      language,
    });

    // Placeholder for TTS integration
    res.json({
      success: true,
      message: 'Audio generation feature coming soon',
      data: {
        text,
        voice,
        speed,
        language,
        placeholder: 'Audio generation will be available soon',
      },
    });

  } catch (error) {
    logger.error('Audio generation failed', { error, userId: req.user?.id });
    next(error);
  }
});

// Audio Transcription
router.post('/audio/transcribe', async (req, res, next) => {
  try {
    const { audioUrl, language = 'auto' } = req.body;

    if (!audioUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Audio URL is required',
      });
    }

    logger.info(`Audio transcription request from user ${req.user?.email}`, {
      audioUrl,
      language,
    });

    // Get audio file data
    let audioData: Buffer;
    let mimeType: string;

    if (audioUrl.startsWith('http')) {
      // Fetch from URL
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      audioData = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'audio/webm';
    } else {
      // Assume it's a local file path
      const fs = await import('fs/promises');
      audioData = await fs.readFile(audioUrl);
      mimeType = audioUrl.includes('.mp3') ? 'audio/mp3' : 
                 audioUrl.includes('.wav') ? 'audio/wav' : 'audio/webm';
    }

    // Use Gemini model for audio transcription
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: audioData.toString('base64'),
          mimeType: mimeType,
        },
      },
      'Please transcribe this audio file. Return only the transcribed text without any additional formatting or explanation.',
    ]);

    const transcript = result.response.text();

    res.json({
      success: true,
      data: {
        transcript: transcript.trim(),
        language: language,
        audioUrl: audioUrl,
      },
    });

  } catch (error) {
    logger.error('Audio transcription failed', { error, userId: req.user?.id });
    next(error);
  }
});

// Chat/Conversation
router.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationId, systemPrompt } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required',
      });
    }

    logger.info(`Chat request from user ${req.user?.email}`, {
      messageLength: message.length,
      conversationId,
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let fullPrompt = message;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\nUser: ${message}`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    res.json({
      success: true,
      data: {
        message: text,
        conversationId: conversationId || `conv_${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Chat request failed', { error, userId: req.user?.id });
    next(error);
  }
});

export default router;