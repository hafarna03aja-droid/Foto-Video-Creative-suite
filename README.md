# 🎥 Foto & Video Creative Suite

**Professional AI-Powered Content Creation Platform**

A modern web application that integrates Google Gemini's power to create text, images, videos, and audio automatically. Built with cutting-edge technology for content creators, digital marketers, and anyone who wants to generate creative materials with ease.

## 🏗️ Architecture Overview

### **Production-Ready Backend Architecture**
- **Express.js Server**: RESTful API with TypeScript
- **JWT Authentication**: Secure user authentication with refresh tokens
- **Rate Limiting**: Built-in protection against abuse
- **Server-Side AI Integration**: Secure API key management
- **File Upload Support**: Multer integration for media handling
- **Comprehensive Logging**: Winston-based structured logging
- **Docker Ready**: Containerized deployment support

### **Modern Frontend Stack**
- **React 18 + TypeScript**: Type-safe component architecture
- **Vite Build System**: Fast development and optimized production builds
- **Backend Service Integration**: Centralized API client with auto token refresh
- **Authentication Wrapper**: Seamless user authentication flow

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key

4. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hafarna03aja-droid/Foto-Video-Creative-suite)

### Manual Deploy
1. Fork/clone this repository
2. Push to your GitHub repository
3. Connect to [Vercel](https://vercel.com)
4. Add environment variable `GEMINI_API_KEY` in Vercel dashboard
5. Deploy automatically

📖 **Detailed deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
