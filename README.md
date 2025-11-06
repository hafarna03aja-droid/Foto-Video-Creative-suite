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

## 🚀 Production Deployment

### Automated Deployment Script
```powershell
# Run the automated deployment script
.\deploy-ultra-simple.ps1
```

This script will:
- ✅ Check all prerequisites (Node.js, npm, Vercel CLI)
- ✅ Build backend with TypeScript compilation
- ✅ Build frontend with Vite production optimization
- ✅ Prepare environment files
- ✅ Guide you through deployment steps

### Manual Vercel Deploy

#### Backend Deployment:
1. Deploy backend API:
   ```bash
   cd backend
   vercel --prod
   ```
2. Copy the backend URL from Vercel output

#### Frontend Deployment:
1. Update environment with backend URL:
   ```bash
   # Edit .env.local
   VITE_API_BASE_URL=https://your-backend-url.vercel.app
   ```
2. Build and deploy frontend:
   ```bash
   npm run build
   vercel --prod
   ```

### Quick Deploy Button
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hafarna03aja-droid/Foto-Video-Creative-suite)

### 🌐 **Live Demo**
**✨ Access the application at: https://foto-video-creative.hafarnas-projects.vercel.app ✨**

📖 **Detailed deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
