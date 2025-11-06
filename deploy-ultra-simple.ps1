# Production Deployment Script for Foto Video Creative Suite
# Ultra Simple Version - No Complex Logic

Write-Host "🎬 Foto Video Creative Suite - Production Deployment" -ForegroundColor Blue
Write-Host "=================================================="

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Not in project root directory!" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "📋 Checking Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "📋 Checking npm..." -ForegroundColor Blue
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Check backend directory
if (!(Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Check environment file
Write-Host "📋 Checking environment..." -ForegroundColor Blue
if (!(Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Write-Host "⚠️ Creating backend .env from example..." -ForegroundColor Yellow
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ Created backend\.env - Please edit with your values" -ForegroundColor Green
    } else {
        Write-Host "❌ No backend .env.example found!" -ForegroundColor Red
        exit 1
    }
}

# Build Backend
Write-Host "📋 Building backend..." -ForegroundColor Blue
Set-Location "backend"

Write-Host "Installing backend dependencies..."
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend npm ci failed!" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host "Building backend TypeScript..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host "✅ Backend built successfully" -ForegroundColor Green
Set-Location ".."

# Build Frontend
Write-Host "📋 Building frontend..." -ForegroundColor Blue

Write-Host "Installing frontend dependencies..."
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend npm ci failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Building frontend React app..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# Check Vercel CLI
Write-Host "📋 Checking Vercel CLI..." -ForegroundColor Blue
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel@latest
}

Write-Host ""
Write-Host "🚀 Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Manual Deployment Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend: cd backend; vercel --prod"
Write-Host "2. Copy the backend URL"
Write-Host "3. Edit .env.local and set VITE_API_BASE_URL"
Write-Host "4. Run: npm run build"
Write-Host "5. Run: vercel --prod"
Write-Host ""
Write-Host "✅ Ready for deployment!" -ForegroundColor Green