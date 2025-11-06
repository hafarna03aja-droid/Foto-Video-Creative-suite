# Production Deployment Script for Foto Video Creative Suite
# Simple and reliable version
# Usage: .\deploy-production-simple.ps1

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false
)

Write-Host "🎬 Foto Video Creative Suite - Production Deployment" -ForegroundColor Blue
Write-Host "=================================================="

# Check requirements
Write-Host "📋 Checking requirements..." -ForegroundColor Blue

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Not in project root directory!" -ForegroundColor Red
    exit 1
}

if (!(Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Setup environment
Write-Host "📋 Setting up environment..." -ForegroundColor Blue

if (!(Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Write-Host "⚠️ Backend .env not found. Creating from example..." -ForegroundColor Yellow
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "Please edit backend\.env with your production values" -ForegroundColor Yellow
        Write-Host "Required: GEMINI_API_KEY, JWT_SECRET, JWT_REFRESH_SECRET" -ForegroundColor Yellow
        Read-Host "Press Enter after editing backend\.env"
    } else {
        Write-Host "❌ Backend .env.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Build Backend
if (!$SkipBuild) {
    Write-Host "📋 Building backend..." -ForegroundColor Blue
    
    Set-Location "backend"
    
    Write-Host "Installing dependencies..."
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend npm ci failed!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Write-Host "Building TypeScript..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend build failed!" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    Write-Host "✅ Backend built successfully" -ForegroundColor Green
    Set-Location ".."
}

# Build Frontend
if (!$SkipBuild) {
    Write-Host "📋 Building frontend..." -ForegroundColor Blue
    
    Write-Host "Installing dependencies..."
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend npm ci failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Building React app..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
}

# Check Vercel CLI
Write-Host "📋 Checking Vercel CLI..." -ForegroundColor Blue
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel@latest
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend: cd backend; vercel --prod"
Write-Host "2. Update .env.local with backend URL"
Write-Host "3. Deploy frontend: vercel --prod"
Write-Host "4. Test your deployment"
Write-Host ""
Write-Host "For automatic deployment, you can manually run:"
Write-Host "  vercel --prod --confirm"
Write-Host ""

$continue = Read-Host "Continue with manual deployment steps? (y/n)"
if ($continue -eq "y" -or $continue -eq "Y") {
    Write-Host ""
    Write-Host "📋 Manual Deployment Guide:" -ForegroundColor Blue
    Write-Host "1. Open a new terminal and run: cd backend; vercel --prod"
    Write-Host "2. Copy the backend URL"
    Write-Host "3. Edit .env.local and set VITE_API_BASE_URL to your backend URL"
    Write-Host "4. Run: npm run build"
    Write-Host "5. Run: vercel --prod"
    Write-Host ""
}

Write-Host "✅ Deployment script completed successfully!" -ForegroundColor Green