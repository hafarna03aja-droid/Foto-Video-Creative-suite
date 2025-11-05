# Production Deployment Script for Foto Video Creative Suite (PowerShell)
# Usage: .\deploy-production.ps1

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false,
    [string]$BackendUrl = "",
    [string]$FrontendUrl = ""
)

# Colors for output
$Red = [ConsoleColor]::Red
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Blue = [ConsoleColor]::Blue
$White = [ConsoleColor]::White

function Write-Step {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Test-Requirements {
    Write-Step "Checking requirements..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($versionNumber -lt 18) {
            Write-Error "Node.js 18 or higher is required. Current: $nodeVersion"
            exit 1
        }
    }
    catch {
        Write-Error "Node.js is not installed or not in PATH"
        exit 1
    }
    
    # Check npm
    try {
        npm --version | Out-Null
    }
    catch {
        Write-Error "npm is not installed or not in PATH"
        exit 1
    }
    
    # Check Git
    try {
        git --version | Out-Null
    }
    catch {
        Write-Error "Git is not installed or not in PATH"
        exit 1
    }
    
    Write-Success "All requirements met"
}

function Setup-Environment {
    Write-Step "Setting up environment variables..."
    
    # Backend environment
    if (!(Test-Path "backend\.env")) {
        Write-Warning "Backend .env file not found. Creating from example..."
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Warning "Please edit backend\.env with your production values"
        Read-Host "Press Enter when ready to continue"
    }
    
    # Frontend environment
    if (!(Test-Path ".env.local")) {
        Write-Warning "Frontend .env.local file not found. Creating..."
        @"
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
VITE_APP_NAME=Foto Video Creative Suite
VITE_VERSION=1.0.0
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Warning "Please edit .env.local with your backend URL"
        Read-Host "Press Enter when ready to continue"
    }
    
    Write-Success "Environment setup complete"
}

function Build-Backend {
    Write-Step "Building backend..."
    
    Push-Location "backend"
    
    try {
        # Install dependencies
        npm ci --only=production
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        
        # Build TypeScript
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        
        Write-Success "Backend built successfully"
    }
    catch {
        Write-Error "Backend build failed: $_"
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Build-Frontend {
    Write-Step "Building frontend..."
    
    try {
        # Install dependencies
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        
        # Build React app
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        
        Write-Success "Frontend built successfully"
    }
    catch {
        Write-Error "Frontend build failed: $_"
        exit 1
    }
}

function Deploy-Backend {
    Write-Step "Deploying backend..."
    
    Push-Location "backend"
    
    try {
        # Check if Vercel CLI is installed
        try {
            vercel --version | Out-Null
        }
        catch {
            Write-Warning "Vercel CLI not found. Installing..."
            npm install -g vercel
        }
        
        # Deploy to Vercel
        Write-Host "Deploying backend to Vercel..."
        vercel --prod --confirm
        if ($LASTEXITCODE -ne 0) { throw "Vercel deployment failed" }
        
        Write-Success "Backend deployed successfully"
        
        # Get backend URL
        $backendInfo = vercel ls --scope=team | Where-Object { $_ -match "backend" } | Select-Object -First 1
        if ($backendInfo) {
            $script:BackendUrl = ($backendInfo -split '\s+')[1]
            Write-Host "Backend URL: https://$BackendUrl" -ForegroundColor $Green
        }
    }
    catch {
        Write-Error "Backend deployment failed: $_"
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Deploy-Frontend {
    Write-Step "Deploying frontend..."
    
    try {
        # Update frontend environment with backend URL
        if ($BackendUrl) {
            @"
VITE_API_BASE_URL=https://$BackendUrl/api
VITE_APP_NAME=Foto Video Creative Suite
VITE_VERSION=1.0.0
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
            
            # Rebuild with new backend URL
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "Frontend rebuild failed" }
        }
        
        # Deploy to Vercel
        Write-Host "Deploying frontend to Vercel..."
        vercel --prod --confirm
        if ($LASTEXITCODE -ne 0) { throw "Vercel deployment failed" }
        
        Write-Success "Frontend deployed successfully"
        
        # Get frontend URL
        $frontendInfo = vercel ls --scope=team | Where-Object { $_ -notmatch "backend" } | Select-Object -First 1
        if ($frontendInfo) {
            $script:FrontendUrl = ($frontendInfo -split '\s+')[1]
            Write-Host "Frontend URL: https://$FrontendUrl" -ForegroundColor $Green
        }
    }
    catch {
        Write-Error "Frontend deployment failed: $_"
        exit 1
    }
}

function Test-Deployment {
    if ($SkipTests) {
        Write-Warning "Skipping deployment tests"
        return
    }
    
    Write-Step "Testing deployment..."
    
    if ($BackendUrl) {
        Write-Host "Testing backend health..."
        try {
            $response = Invoke-WebRequest -Uri "https://$BackendUrl/api/health" -Method GET -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend health check passed"
            }
            else {
                Write-Error "Backend health check failed (HTTP $($response.StatusCode))"
            }
        }
        catch {
            Write-Error "Backend health check failed: $_"
        }
    }
    
    if ($FrontendUrl) {
        Write-Host "Testing frontend..."
        try {
            $response = Invoke-WebRequest -Uri "https://$FrontendUrl" -Method GET -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Frontend check passed"
            }
            else {
                Write-Error "Frontend check failed (HTTP $($response.StatusCode))"
            }
        }
        catch {
            Write-Error "Frontend check failed: $_"
        }
    }
}

function Show-Summary {
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor $Green
    Write-Host "========================="
    
    if ($BackendUrl) {
        Write-Host "Backend:  https://$BackendUrl" -ForegroundColor $White
        Write-Host "API:      https://$BackendUrl/api" -ForegroundColor $White
        Write-Host "Health:   https://$BackendUrl/api/health" -ForegroundColor $White
    }
    
    if ($FrontendUrl) {
        Write-Host "Frontend: https://$FrontendUrl" -ForegroundColor $White
    }
    
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor $Yellow
    Write-Host "1. Test all application features"
    Write-Host "2. Set up monitoring and alerts"
    Write-Host "3. Configure custom domain (optional)"
    Write-Host "4. Set up CI/CD pipeline"
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor $Blue
    Write-Host "- README.md for usage instructions"
    Write-Host "- DEPLOYMENT.md for deployment details"  
    Write-Host "- PRODUCTION-OPTIMIZATION.md for performance tuning"
}

# Main execution
function Main {
    Write-Host "🎬 Foto Video Creative Suite - Production Deployment" -ForegroundColor $Blue
    Write-Host "=================================================="
    
    Test-Requirements
    Setup-Environment
    
    if (!$SkipBuild) {
        Build-Backend
        Build-Frontend
    }
    
    Deploy-Backend
    Deploy-Frontend
    Test-Deployment
    Show-Summary
}

# Handle Ctrl+C gracefully
try {
    Main
}
catch {
    Write-Host ""
    Write-Error "Deployment interrupted or failed: $_"
    exit 1
}