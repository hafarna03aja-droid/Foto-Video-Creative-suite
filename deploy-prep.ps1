# Deployment preparation script for Vercel (Windows PowerShell)

Write-Host "🚀 Preparing project for Vercel deployment..." -ForegroundColor Green

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "⚠️  Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "📝 Please edit .env.local and add your GEMINI_API_KEY" -ForegroundColor Cyan
}

# Test build
Write-Host "🔨 Testing build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Ensure .env.local has your GEMINI_API_KEY"
    Write-Host "2. Commit and push to GitHub:"
    Write-Host "   git add ."
    Write-Host "   git commit -m 'Prepare for deployment'"
    Write-Host "   git push origin main"
    Write-Host "3. Deploy on Vercel:"
    Write-Host "   - Visit https://vercel.com"
    Write-Host "   - Import your GitHub repository" 
    Write-Host "   - Add GEMINI_API_KEY environment variable"
    Write-Host "   - Deploy!"
} else {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}