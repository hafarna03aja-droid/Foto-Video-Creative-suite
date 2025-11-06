# 🚀 Production Deployment Guide - Foto Video Creative Suite

## 🎯 Quick Start

### Automated Deployment (Recommended)
```powershell
# Run the automated deployment script
.\deploy-ultra-simple.ps1
```

### Manual Deployment Steps
1. **Deploy Backend**: `cd backend && vercel --prod`
2. **Update Frontend Environment** with backend URL
3. **Deploy Frontend**: `vercel --prod`

## 📋 Prerequisites

- Node.js (version 18+)
- npm package manager
- Vercel CLI (auto-installed by script)
- Google Gemini API key

## 🛠️ Automated Deployment Script

The `deploy-ultra-simple.ps1` script provides a complete deployment workflow:

**Features:**
- ✅ Validates all prerequisites
- ✅ Builds backend TypeScript
- ✅ Builds frontend React app
- ✅ Sets up environment files
- ✅ Installs Vercel CLI
- ✅ Provides deployment guidance

**Usage:**
```powershell
.\deploy-ultra-simple.ps1
```

## 🔧 Manual Deployment Process

### Step 1: Environment Setup

1. **Push ke GitHub Repository**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect ke Vercel**
   - Buka [vercel.com](https://vercel.com)
   - Sign in dengan GitHub account
   - Click "New Project"
   - Import repository `Foto-Video-Creative-suite`

3. **Configure Environment Variables**
   - Di Vercel dashboard, pilih project
   - Go to Settings > Environment Variables
   - Add variable:
     - Name: `GEMINI_API_KEY`
     - Value: [Your actual Gemini API key]
     - Environment: Production, Preview, Development

4. **Deploy**
   - Vercel akan automatically deploy
   - Domain akan tersedia di format: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow prompts untuk setup project
   - Set environment variables saat ditanya

4. **Deploy Production**
   ```bash
   vercel --prod
   ```

## Konfigurasi yang Sudah Disiapkan

### vercel.json
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- Environment variables mapping
- SPA routing configuration

### Vite Configuration
- Environment variables sudah configured untuk production
- Build optimization enabled

## Troubleshooting

### Build Issues
- Pastikan semua dependencies terinstall
- Check TypeScript errors: `npm run build`

### Environment Variables
- Pastikan GEMINI_API_KEY sudah di-set di Vercel dashboard
- Check di Vercel Settings > Environment Variables

### Routing Issues
- SPA routing sudah configured di vercel.json
- Semua routes akan redirect ke index.html

## Post-Deployment

### Custom Domain (Optional)
1. Di Vercel dashboard > Domains
2. Add custom domain
3. Update DNS records sesuai instruksi Vercel

### Monitoring
- Check Vercel dashboard untuk deployment logs
- Monitor performance di Vercel Analytics

## Development Workflow

### Local Development
```bash
npm install
cp .env.example .env.local
# Edit .env.local dengan API key
npm run dev
```

### Preview Deployment
```bash
git push origin main
# Vercel akan auto-deploy preview untuk setiap commit
```

### Production Deployment
```bash
git push origin main
# Merge/push ke main branch untuk production deployment
```