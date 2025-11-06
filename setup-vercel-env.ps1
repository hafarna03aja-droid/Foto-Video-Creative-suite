# 🚀 Perfect Vercel Environment Variables Setup Script
# This script provides interactive setup for all environment variables

param(
    [switch]$Auto,
    [switch]$Manual,
    [switch]$Help
)

if ($Help) {
    Write-Host "🚀 Foto Video Creative Suite - Environment Setup" -ForegroundColor Cyan
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\setup-vercel-env.ps1         # Interactive mode (recommended)" -ForegroundColor White
    Write-Host "  .\setup-vercel-env.ps1 -Auto   # Automatic setup with defaults" -ForegroundColor White
    Write-Host "  .\setup-vercel-env.ps1 -Manual # Show manual instructions only" -ForegroundColor White
    exit 0
}

function Show-Banner {
    Write-Host "" -ForegroundColor White
    Write-Host "🚀 ════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🎯   FOTO VIDEO CREATIVE SUITE - ENVIRONMENT SETUP           " -ForegroundColor Cyan
    Write-Host "� ════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor White
}

function Test-VercelCli {
    try {
        $vercelVersion = vercel --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Vercel CLI not found!" -ForegroundColor Red
        Write-Host "📖 Install with: npm install -g vercel" -ForegroundColor Yellow
        return $false
    }
}

function Get-UserInput {
    param([string]$Prompt, [string]$Default = "")
    
    if ($Default) {
        $input = Read-Host "$Prompt (default: $Default)"
        return if ($input) { $input } else { $Default }
    } else {
        return Read-Host $Prompt
    }
}

function Set-EnvironmentVariables {
    Write-Host "🔧 Setting up Backend Environment Variables..." -ForegroundColor Green
    Write-Host "📋 You'll need to provide the following values:" -ForegroundColor Yellow
    Write-Host ""
    
    # Get values from user
    $corsOrigins = "https://foto-video-creative-suite.vercel.app,https://foto-video-creative-suite-llq7bxxdb-hafarnas-projects.vercel.app,http://localhost:5173,http://localhost:3000"
    
    Write-Host "📝 Environment Variables to Set:" -ForegroundColor Cyan
    Write-Host "   CORS_ORIGINS = $corsOrigins" -ForegroundColor White
    
    $geminiKey = Get-UserInput "🔑 Enter your Gemini API Key (get from https://aistudio.google.com/app/apikey)"
    $jwtSecret = Get-UserInput "🔐 Enter JWT Secret (leave empty for auto-generate)" ""
    $jwtRefreshSecret = Get-UserInput "🔄 Enter JWT Refresh Secret (leave empty for auto-generate)" ""
    
    # Generate secrets if not provided
    if (-not $jwtSecret) {
        $jwtSecret = -join ((1..64) | ForEach {[char]((65..90) + (97..122) + (48..57) | Get-Random)})
        Write-Host "🎲 Generated JWT Secret: $($jwtSecret.Substring(0,20))..." -ForegroundColor Yellow
    }
    
    if (-not $jwtRefreshSecret) {
        $jwtRefreshSecret = -join ((1..64) | ForEach {[char]((65..90) + (97..122) + (48..57) | Get-Random)})
        Write-Host "🎲 Generated JWT Refresh Secret: $($jwtRefreshSecret.Substring(0,20))..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🚀 Setting environment variables in Vercel..." -ForegroundColor Green
    
    Set-Location "backend"
    
    # Set variables
    Write-Host "   Setting CORS_ORIGINS..." -ForegroundColor Yellow
    echo $corsOrigins | vercel env add CORS_ORIGINS production
    
    Write-Host "   Setting GEMINI_API_KEY..." -ForegroundColor Yellow  
    echo $geminiKey | vercel env add GEMINI_API_KEY production
    
    Write-Host "   Setting JWT_SECRET..." -ForegroundColor Yellow
    echo $jwtSecret | vercel env add JWT_SECRET production
    
    Write-Host "   Setting JWT_REFRESH_SECRET..." -ForegroundColor Yellow
    echo $jwtRefreshSecret | vercel env add JWT_REFRESH_SECRET production
    
    Set-Location ".."
    
    Write-Host "✅ All environment variables set!" -ForegroundColor Green
}

function Show-ManualInstructions {
    Write-Host "📖 Manual Setup Instructions" -ForegroundColor Cyan
    Write-Host "══════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Go to: https://vercel.com/dashboard" -ForegroundColor Yellow
    Write-Host "📦 Select: foto-video-creative-suite-backend" -ForegroundColor White
    Write-Host "⚙️  Navigate: Settings > Environment Variables" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Add these variables for 'Production' environment:" -ForegroundColor Green
    Write-Host ""
    Write-Host "   CORS_ORIGINS" -ForegroundColor Cyan
    Write-Host "   Value: https://foto-video-creative-suite.vercel.app,https://foto-video-creative-suite-llq7bxxdb-hafarnas-projects.vercel.app,http://localhost:5173,http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "   GEMINI_API_KEY" -ForegroundColor Cyan
    Write-Host "   Value: [Get from https://aistudio.google.com/app/apikey]" -ForegroundColor White
    Write-Host ""
    Write-Host "   JWT_SECRET" -ForegroundColor Cyan
    Write-Host "   Value: [Generate a secure random 64-character string]" -ForegroundColor White
    Write-Host ""
    Write-Host "   JWT_REFRESH_SECRET" -ForegroundColor Cyan
    Write-Host "   Value: [Generate another secure random 64-character string]" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 After adding all variables, click 'Redeploy' in the Deployments tab" -ForegroundColor Yellow
}

# Main execution
Show-Banner

if (-not (Test-VercelCli)) {
    exit 1
}

if ($Manual) {
    Show-ManualInstructions
    exit 0
}

Write-Host "🎯 Choose setup method:" -ForegroundColor Yellow
Write-Host "   [1] Interactive Setup (Recommended)" -ForegroundColor Green
Write-Host "   [2] Manual Instructions Only" -ForegroundColor White
Write-Host "   [3] Exit" -ForegroundColor Red

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" { 
        Set-EnvironmentVariables
        Write-Host ""
        Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
        Write-Host "🔄 Don't forget to redeploy your backend!" -ForegroundColor Yellow
        Write-Host "   Run: cd backend && vercel --prod" -ForegroundColor Cyan
    }
    "2" { 
        Show-ManualInstructions 
    }
    "3" { 
        Write-Host "👋 Goodbye!" -ForegroundColor Yellow
        exit 0 
    }
    default { 
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
        exit 1 
    }
}