# Simple Auto Environment Setup
Write-Host "🤖 Auto Environment Setup - Foto Video Creative Suite" -ForegroundColor Cyan

# Check Vercel CLI
try {
    $whoami = vercel whoami 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vercel authenticated as: $whoami" -ForegroundColor Green
    } else {
        Write-Host "❌ Please run: vercel login" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Vercel CLI not found. Install: npm install -g vercel" -ForegroundColor Red
    exit 1
}

# Get Gemini API Key
Write-Host ""
Write-Host "🔑 Enter your Gemini API Key:" -ForegroundColor Yellow
Write-Host "   Get it from: https://aistudio.google.com/app/apikey" -ForegroundColor Cyan
$geminiKey = Read-Host "Gemini API Key"

if ($geminiKey.Length -lt 10) {
    Write-Host "❌ Invalid API key" -ForegroundColor Red
    exit 1
}

# Generate secure secrets
Write-Host ""
Write-Host "🔐 Generating secure JWT secrets..." -ForegroundColor Green

function Generate-Secret {
    param([int]$Length = 64)
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    -join ((1..$Length) | ForEach { $chars[(Get-Random -Maximum $chars.Length)] })
}

$jwtSecret = Generate-Secret 64
$jwtRefreshSecret = Generate-Secret 64
$corsOrigins = "https://foto-video-creative-suite.vercel.app,http://localhost:5173,http://localhost:3000"

Write-Host "✅ Generated JWT secrets" -ForegroundColor Green

# Set environment variables
Write-Host ""
Write-Host "🚀 Setting environment variables in Vercel..." -ForegroundColor Green

Set-Location "backend"

Write-Host "   Setting CORS_ORIGINS..." -ForegroundColor Yellow
echo $corsOrigins | vercel env add CORS_ORIGINS production

Write-Host "   Setting GEMINI_API_KEY..." -ForegroundColor Yellow
echo $geminiKey | vercel env add GEMINI_API_KEY production

Write-Host "   Setting JWT_SECRET..." -ForegroundColor Yellow  
echo $jwtSecret | vercel env add JWT_SECRET production

Write-Host "   Setting JWT_REFRESH_SECRET..." -ForegroundColor Yellow
echo $jwtRefreshSecret | vercel env add JWT_REFRESH_SECRET production

Set-Location ".."

# Save to local file
$envContent = @"
# Environment Variables - $(Get-Date)
CORS_ORIGINS=$corsOrigins
GEMINI_API_KEY=$geminiKey
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$jwtRefreshSecret
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Environment variables configured!" -ForegroundColor Green
Write-Host "💾 Saved backup to .env.local" -ForegroundColor Cyan

# Redeploy backend
Write-Host ""
Write-Host "🔄 Redeploying backend..." -ForegroundColor Green
Set-Location "backend"
vercel --prod
Set-Location ".."

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "🌐 Frontend: https://foto-video-creative-suite.vercel.app" -ForegroundColor Cyan
Write-Host "🌐 Backend: https://foto-video-creative-suite-backend.vercel.app" -ForegroundColor Cyan