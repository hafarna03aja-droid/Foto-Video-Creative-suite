# Vercel Environment Variables Setup Script
# This script sets up environment variables for both frontend and backend

Write-Host "🔧 Setting up Vercel Environment Variables..." -ForegroundColor Green

# Backend Environment Variables
Write-Host "📦 Configuring Backend Environment Variables..." -ForegroundColor Yellow

cd backend

# CORS Origins with correct frontend URLs
vercel env add CORS_ORIGINS production
# When prompted, enter: https://foto-video-creative-suite.vercel.app,https://foto-video-creative-suite-llq7bxxdb-hafarnas-projects.vercel.app,http://localhost:5173,http://localhost:3000

Write-Host "✅ Backend environment variables configured!" -ForegroundColor Green

cd ..

Write-Host "🎉 Environment variable setup complete!" -ForegroundColor Green
Write-Host "🔄 Please manually set the following in Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   Backend Project: foto-video-creative-suite-backend" -ForegroundColor White
Write-Host "   CORS_ORIGINS = https://foto-video-creative-suite.vercel.app,https://foto-video-creative-suite-llq7bxxdb-hafarnas-projects.vercel.app,http://localhost:5173,http://localhost:3000" -ForegroundColor White
Write-Host "   GEMINI_API_KEY = [Your Gemini API Key]" -ForegroundColor White