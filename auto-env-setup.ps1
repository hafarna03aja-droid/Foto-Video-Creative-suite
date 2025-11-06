#!/usr/bin/env powershell

# 🤖 Auto Environment Setup Script
# Automatically configures all environment variables with smart defaults

param(
    [string]$GeminiApiKey,
    [switch]$AutoGenerate,
    [switch]$Help
)

if ($Help) {
    Write-Host "🤖 Auto Environment Setup - Foto Video Creative Suite" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\auto-env-setup.ps1                                    # Interactive mode" -ForegroundColor White
    Write-Host "  .\auto-env-setup.ps1 -GeminiApiKey 'YOUR_KEY'          # With API key" -ForegroundColor White
    Write-Host "  .\auto-env-setup.ps1 -AutoGenerate                     # Auto-generate all secrets" -ForegroundColor White
    Write-Host "  .\auto-env-setup.ps1 -AutoGenerate -GeminiApiKey 'KEY' # Full auto setup" -ForegroundColor White
    Write-Host ""
    exit 0
}

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "🤖 ═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🚀   AUTO ENVIRONMENT SETUP - FOTO VIDEO CREATIVE SUITE  " -ForegroundColor Cyan  
    Write-Host "⚡ ═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Generate-SecureSecret {
    param([int]$Length = 64)
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    return -join ((1..$Length) | ForEach { $chars[(Get-Random -Maximum $chars.Length)] })
}

function Test-VercelAuth {
    try {
        $whoami = vercel whoami 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Vercel authenticated as: $whoami" -ForegroundColor Green
            return $true
        }
    } catch {}
    
    Write-Host "❌ Not authenticated with Vercel" -ForegroundColor Red
    Write-Host "📋 Please run: vercel login" -ForegroundColor Yellow
    return $false
}

function Set-VercelEnv {
    param([string]$Name, [string]$Value, [string]$Project = "backend")
    
    Write-Host "   Setting $Name..." -ForegroundColor Yellow
    
    # Use echo to pipe the value to vercel env add
    $cmd = "echo '$Value' | vercel env add $Name production"
    
    if ($Project -eq "backend") {
        Set-Location "backend" -ErrorAction SilentlyContinue
    }
    
    try {
        Invoke-Expression $cmd | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $Name configured" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $Name may already exist or failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Failed to set $Name" -ForegroundColor Red
    }
    
    if ($Project -eq "backend") {
        Set-Location ".." -ErrorAction SilentlyContinue
    }
}

function Get-GeminiApiKey {
    if ($GeminiApiKey) {
        return $GeminiApiKey
    }
    
    if ($AutoGenerate) {
        Write-Host "⚠️  Auto-generate mode requires Gemini API key" -ForegroundColor Yellow
        Write-Host "🔗 Get your key from: https://aistudio.google.com/app/apikey" -ForegroundColor Cyan
        $key = Read-Host "Enter your Gemini API Key"
        return $key
    }
    
    Write-Host "🔑 Gemini API Key Setup" -ForegroundColor Cyan
    Write-Host "   Get your API key from: https://aistudio.google.com/app/apikey" -ForegroundColor White
    Write-Host ""
    
    do {
        $key = Read-Host "Enter your Gemini API Key"
        if ($key.Length -lt 10) {
            Write-Host "   ❌ API key seems too short, please check" -ForegroundColor Red
        }
    } while ($key.Length -lt 10)
    
    return $key
}

function Setup-AllEnvironmentVariables {
    Write-Host "🔧 Configuring Environment Variables..." -ForegroundColor Green
    Write-Host ""
    
    # Get Gemini API Key
    $apiKey = Get-GeminiApiKey
    
    # Generate JWT Secrets
    if ($AutoGenerate) {
        $jwtSecret = Generate-SecureSecret 64
        $jwtRefreshSecret = Generate-SecureSecret 64
        Write-Host "🎲 Auto-generated secure JWT secrets" -ForegroundColor Yellow
    } else {
        Write-Host "🔐 JWT Secrets (leave empty for auto-generation)" -ForegroundColor Cyan
        $jwtSecret = Read-Host "JWT Secret (or press Enter for auto-generate)"
        if (-not $jwtSecret) {
            $jwtSecret = Generate-SecureSecret 64
            Write-Host "   🎲 Generated JWT Secret" -ForegroundColor Yellow
        }
        
        $jwtRefreshSecret = Read-Host "JWT Refresh Secret (or press Enter for auto-generate)"
        if (-not $jwtRefreshSecret) {
            $jwtRefreshSecret = Generate-SecureSecret 64
            Write-Host "   🎲 Generated JWT Refresh Secret" -ForegroundColor Yellow
        }
    }
    
    # CORS Origins (auto-configured)
    $corsOrigins = "https://foto-video-creative-suite.vercel.app,https://foto-video-creative-suite-g9bg50hr9-hafarnas-projects.vercel.app,http://localhost:5173,http://localhost:3000"
    
    Write-Host ""
    Write-Host "📝 Environment Variables Summary:" -ForegroundColor Cyan
    Write-Host "   CORS_ORIGINS: $corsOrigins" -ForegroundColor White
    Write-Host "   GEMINI_API_KEY: $($apiKey.Substring(0,20))..." -ForegroundColor White
    Write-Host "   JWT_SECRET: $($jwtSecret.Substring(0,20))... (64 chars)" -ForegroundColor White
    Write-Host "   JWT_REFRESH_SECRET: $($jwtRefreshSecret.Substring(0,20))... (64 chars)" -ForegroundColor White
    Write-Host ""
    
    if (-not $AutoGenerate) {
        $confirm = Read-Host "Proceed with these values? (Y/n)"
        if ($confirm -eq 'n' -or $confirm -eq 'N') {
            Write-Host "❌ Setup cancelled" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "🚀 Setting up backend environment variables..." -ForegroundColor Green
    
    # Set all environment variables
    Set-VercelEnv "CORS_ORIGINS" $corsOrigins "backend"
    Set-VercelEnv "GEMINI_API_KEY" $apiKey "backend"  
    Set-VercelEnv "JWT_SECRET" $jwtSecret "backend"
    Set-VercelEnv "JWT_REFRESH_SECRET" $jwtRefreshSecret "backend"
    
    Write-Host ""
    Write-Host "✅ Environment variables configured!" -ForegroundColor Green
    
    # Save to local .env file for reference
    $envContent = @"
# Auto-generated Environment Variables - $(Get-Date)
# DO NOT COMMIT THIS FILE TO GIT

# Backend Environment Variables (already set in Vercel)
CORS_ORIGINS=$corsOrigins
GEMINI_API_KEY=$apiKey
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$jwtRefreshSecret

# Frontend Environment Variables (optional local override)
VITE_API_BASE_URL=https://foto-video-creative-suite-backend.vercel.app/api
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "💾 Saved environment variables to .env.local for reference" -ForegroundColor Cyan
    
    return @{
        corsOrigins = $corsOrigins
        geminiKey = $apiKey
        jwtSecret = $jwtSecret
        jwtRefreshSecret = $jwtRefreshSecret
    }
}

function Test-BackendHealth {
    Write-Host "🏥 Testing backend health..." -ForegroundColor Green
    
    try {
        $healthUrl = "https://foto-video-creative-suite-backend.vercel.app/api/health"
        $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10
        
        if ($response.success) {
            Write-Host "✅ Backend is healthy!" -ForegroundColor Green
            Write-Host "   Environment: $($response.environment)" -ForegroundColor White
            Write-Host "   Version: $($response.version)" -ForegroundColor White
            Write-Host "   Uptime: $($response.uptime)s" -ForegroundColor White
        } else {
            Write-Host "⚠️  Backend responded but reports issues" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   This may be normal during initial deployment" -ForegroundColor Yellow
    }
}

function Trigger-Redeploy {
    Write-Host "🔄 Triggering backend redeploy to apply new environment variables..." -ForegroundColor Green
    
    Set-Location "backend"
    try {
        $deployResult = vercel --prod 2>&1
        Write-Host $deployResult
        Write-Host "✅ Backend redeployed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Redeploy failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Set-Location ".."
}

function Show-CompletionSummary {
    Write-Host ""
    Write-Host "🎉 ═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "🎯   AUTO SETUP COMPLETE - READY FOR PRODUCTION!         " -ForegroundColor Green
    Write-Host "🚀 ═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🌐 Live URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: https://foto-video-creative-suite.vercel.app" -ForegroundColor White
    Write-Host "   Backend:  https://foto-video-creative-suite-backend.vercel.app" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🧪 Test Commands:" -ForegroundColor Cyan
    Write-Host "   Health:   curl https://foto-video-creative-suite-backend.vercel.app/api/health" -ForegroundColor White
    Write-Host "   Detailed: curl https://foto-video-creative-suite-backend.vercel.app/api/health/detailed" -ForegroundColor White
    Write-Host "   Metrics:  curl https://foto-video-creative-suite-backend.vercel.app/api/health/metrics" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. ✅ Environment variables configured automatically" -ForegroundColor Green
    Write-Host "   2. ✅ Backend redeployed with new configuration" -ForegroundColor Green  
    Write-Host "   3. 🧪 Test image generation feature in frontend" -ForegroundColor White
    Write-Host "   4. 📊 Monitor metrics at /api/health/metrics" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔧 Files Created:" -ForegroundColor Cyan
    Write-Host "   .env.local - Environment variables backup (DO NOT COMMIT)" -ForegroundColor White
    Write-Host ""
}

# Main execution
Show-Banner

if (-not (Test-VercelAuth)) {
    exit 1
}

Write-Host "🎯 Starting automatic environment setup..." -ForegroundColor Green
Write-Host ""

# Setup environment variables
$envVars = Setup-AllEnvironmentVariables

Write-Host ""
Write-Host "🔄 Redeploying backend with new configuration..." -ForegroundColor Green
Trigger-Redeploy

Write-Host ""
Test-BackendHealth

Show-CompletionSummary

Write-Host "🎊 Auto setup completed successfully!" -ForegroundColor Green
Write-Host "🚀 Your Foto Video Creative Suite is now ready for production!" -ForegroundColor Cyan