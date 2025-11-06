#!/usr/bin/env powershell

# Comprehensive Vercel Deployment and Environment Setup Script
# This script handles complete deployment of Foto Video Creative Suite

param(
    [switch]$SetupEnv,
    [switch]$DeployOnly,
    [switch]$Help
)

if ($Help) {
    Write-Host "🚀 Foto Video Creative Suite - Deployment Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-comprehensive.ps1                # Full deployment (build + deploy + env setup)"
    Write-Host "  .\deploy-comprehensive.ps1 -SetupEnv      # Setup environment variables only"
    Write-Host "  .\deploy-comprehensive.ps1 -DeployOnly    # Deploy only (no env setup)"
    Write-Host "  .\deploy-comprehensive.ps1 -Help          # Show this help"
    Write-Host ""
    exit 0
}

Write-Host "🚀 Foto Video Creative Suite - Comprehensive Deployment" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if we're in the right directory
function Test-ProjectDirectory {
    if (!(Test-Path "package.json") -or !(Test-Path "backend") -or !(Test-Path "components")) {
        Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
        Write-Host "   Make sure you're in the 'Foto-Video-Creative-suite' folder" -ForegroundColor Yellow
        exit 1
    }
}

# Function to build projects
function Build-Projects {
    Write-Host "📦 Building Projects..." -ForegroundColor Green
    
    # Build frontend
    Write-Host "   Building Frontend..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    
    # Build backend
    Write-Host "   Building Backend..." -ForegroundColor Yellow
    Set-Location "backend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend build failed!" -ForegroundColor Red
        exit 1
    }
    Set-Location ".."
    
    Write-Host "✅ All builds completed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Function to deploy projects
function Deploy-Projects {
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
    
    # Deploy backend
    Write-Host "   Deploying Backend..." -ForegroundColor Yellow
    Set-Location "backend"
    $backendResult = vercel --prod 2>&1
    Write-Host $backendResult
    Set-Location ".."
    
    # Deploy frontend
    Write-Host "   Deploying Frontend..." -ForegroundColor Yellow
    $frontendResult = vercel --prod 2>&1
    Write-Host $frontendResult
    
    Write-Host "✅ Deployments completed!" -ForegroundColor Green
    Write-Host ""
}

# Function to setup environment variables
function Setup-EnvironmentVariables {
    Write-Host "🔧 Environment Variables Setup Instructions" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📋 Please manually configure these environment variables in Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🎯 Backend Project: foto-video-creative-suite-backend" -ForegroundColor Cyan
    Write-Host "   CORS_ORIGINS = https://foto-video-creative-suite.vercel.app,https://foto-video-creative-suite-llq7bxxdb-hafarnas-projects.vercel.app,http://localhost:5173,http://localhost:3000" -ForegroundColor White
    Write-Host "   GEMINI_API_KEY = [Your Gemini API Key from Google AI Studio]" -ForegroundColor White
    Write-Host "   JWT_SECRET = [Generate a secure random string]" -ForegroundColor White
    Write-Host "   JWT_REFRESH_SECRET = [Generate another secure random string]" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🌐 Frontend Project: foto-video-creative-suite" -ForegroundColor Cyan
    Write-Host "   VITE_API_URL = https://foto-video-creative-suite-backend-dq1u2cqgc-hafarnas-projects.vercel.app" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📖 Steps to set environment variables:" -ForegroundColor Yellow
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select the project (backend or frontend)" -ForegroundColor White
    Write-Host "3. Go to Settings > Environment Variables" -ForegroundColor White
    Write-Host "4. Add each variable with 'Production' environment" -ForegroundColor White
    Write-Host "5. Redeploy the project after adding variables" -ForegroundColor White
    Write-Host ""
}

# Function to show current status
function Show-Status {
    Write-Host "📊 Current Deployment Status" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🌐 Live URLs:" -ForegroundColor Yellow
    Write-Host "   Frontend: https://foto-video-creative-suite.vercel.app" -ForegroundColor Cyan
    Write-Host "   Backend:  https://foto-video-creative-suite-backend-dq1u2cqgc-hafarnas-projects.vercel.app" -ForegroundColor Cyan
    Write-Host "   Local:    http://localhost:5173/" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Set up environment variables in Vercel Dashboard" -ForegroundColor White
    Write-Host "2. Test CORS functionality by trying image generation" -ForegroundColor White
    Write-Host "3. Monitor for any 'Failed to fetch' errors" -ForegroundColor White
    Write-Host "4. Check browser console for CORS-related messages" -ForegroundColor White
    Write-Host ""
}

# Main execution logic
Test-ProjectDirectory

if ($SetupEnv) {
    Setup-EnvironmentVariables
    Show-Status
    exit 0
}

if ($DeployOnly) {
    Deploy-Projects
    Show-Status
    exit 0
}

# Full deployment process
Build-Projects
Deploy-Projects
Setup-EnvironmentVariables
Show-Status

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "Don't forget to set up environment variables manually!" -ForegroundColor Yellow