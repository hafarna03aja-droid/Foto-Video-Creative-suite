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
        Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "Node.js is not installed or not in PATH"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Host "npm version: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "npm is not installed or not in PATH"
        exit 1
    }
    
    # Check Git
    try {
        $gitVersion = git --version
        Write-Host "Git version: $gitVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "Git is not installed or not in PATH"
        exit 1
    }
    
    Write-Success "All requirements met"
}

function Setup-Environment {
    Write-Step "Setting up environment variables..."
    
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Error "Not in project root directory. Please run from Foto-Video-Creative-suite folder."
        exit 1
    }
    
    # Backend environment setup
    if (!(Test-Path "backend")) {
        Write-Error "Backend directory not found!"
        exit 1
    }
    
    if (!(Test-Path "backend\.env")) {
        if (Test-Path "backend\.env.example") {
            Write-Warning "Backend .env file not found. Creating from example..."
            Copy-Item "backend\.env.example" "backend\.env"
            Write-Warning "Please edit backend\.env with your production values"
            Write-Host "Required variables: GEMINI_API_KEY, JWT_SECRET, JWT_REFRESH_SECRET" -ForegroundColor Yellow
            
            # Prompt for essential values
            $geminiKey = Read-Host "Enter your Gemini API Key (or press Enter to edit file manually)"
            if ($geminiKey) {
                (Get-Content "backend\.env") -replace "GEMINI_API_KEY=.*", "GEMINI_API_KEY=$geminiKey" | Set-Content "backend\.env"
            }
            
            Read-Host "Press Enter after editing backend\.env file"
        } else {
            Write-Error "Backend .env.example file not found!"
            exit 1
        }
    } else {
        Write-Success "Backend .env file already exists"
    }
    
    # Frontend environment setup
    if (!(Test-Path ".env.local")) {
        Write-Warning "Frontend .env.local file not found. Creating..."
        $envContent = "# Frontend Environment Variables`nVITE_API_BASE_URL=http://localhost:3001/api`nVITE_APP_NAME=Foto Video Creative Suite`nVITE_VERSION=1.0.0"
        $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Success "Created .env.local (will be updated with backend URL during deployment)"
    } else {
        Write-Success "Frontend .env.local file already exists"
    }
    
    Write-Success "Environment setup complete"
}

function Build-Backend {
    Write-Step "Building backend..."
    
    if (!(Test-Path "backend")) {
        Write-Error "Backend directory not found!"
        exit 1
    }
    
    Push-Location "backend"
    
    try {
        Write-Host "Installing backend dependencies..."
        # Use modern npm ci command for production
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        
        Write-Host "Building TypeScript..."
        # Build TypeScript
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        
        # Verify build output
        if (!(Test-Path "dist/server.js")) {
            throw "Build output not found - dist/server.js missing"
        }
        
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
        # Check if we're in the right directory
        if (!(Test-Path "package.json")) {
            throw "Frontend package.json not found!"
        }
        
        Write-Host "Installing frontend dependencies..."
        # Install dependencies
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        
        Write-Host "Building React application..."
        # Build React app
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
        
        # Verify build output
        if (!(Test-Path "dist")) {
            throw "Build output not found - dist directory missing"
        }
        
        Write-Success "Frontend built successfully"
    }
    catch {
        Write-Error "Frontend build failed: $_"
        exit 1
    }
}

function Deploy-Backend {
    Write-Step "Deploying backend..."
    
    if (!(Test-Path "backend")) {
        Write-Error "Backend directory not found!"
        exit 1
    }
    
    Push-Location "backend"
    
    try {
        # Check if Vercel CLI is installed
        try {
            $vercelVersion = vercel --version 2>$null
            Write-Host "Using Vercel CLI version: $vercelVersion"
        }
        catch {
            Write-Warning "Vercel CLI not found. Installing..."
            npm install -g vercel@latest
            if ($LASTEXITCODE -ne 0) { throw "Failed to install Vercel CLI" }
        }
        
        # Ensure build exists
        if (!(Test-Path "dist/server.js")) {
            Write-Warning "Backend build not found. Building first..."
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
        }
        
        Write-Host "Deploying backend to Vercel..."
        Write-Host "Note: You may need to authenticate with Vercel if this is your first deployment"
        
        # Deploy to Vercel with better error handling
        $deployOutput = vercel --prod --yes 2>&1 | Out-String
        if ($LASTEXITCODE -ne 0) { 
            Write-Error "Vercel deployment failed: $deployOutput"
            throw "Vercel deployment failed" 
        }
        
        Write-Success "Backend deployed successfully"
        
        # Extract URL from deployment output
        $urlPattern = "https://[\w\-]+\.vercel\.app"
        if ($deployOutput -match $urlPattern) {
            $script:BackendUrl = $matches[0] -replace "https://", ""
            Write-Host "Backend URL: https://$($script:BackendUrl)" -ForegroundColor $Green
        } else {
            Write-Warning "Could not extract backend URL from deployment output"
            Write-Host "Please check your Vercel dashboard for the deployment URL"
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
        # Update frontend environment with backend URL if available
        if ($script:BackendUrl) {
            Write-Host "Updating frontend environment with backend URL: https://$($script:BackendUrl)"
            $envContent = "# Frontend Environment Variables (Production)`nVITE_API_BASE_URL=https://$($script:BackendUrl)/api`nVITE_APP_NAME=Foto Video Creative Suite`nVITE_VERSION=1.0.0"
            $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
            
            Write-Host "Rebuilding frontend with new backend URL..."
            # Rebuild with new backend URL
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "Frontend rebuild failed" }
        } else {
            Write-Warning "No backend URL available. Using default local configuration."
            # Ensure we have a build
            if (!(Test-Path "dist")) {
                Write-Host "Building frontend..."
                npm run build
                if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
            }
        }
        
        Write-Host "Deploying frontend to Vercel..."
        
        # Deploy to Vercel with better error handling
        $deployOutput = vercel --prod --yes 2>&1 | Out-String
        if ($LASTEXITCODE -ne 0) { 
            Write-Error "Vercel deployment failed: $deployOutput"
            throw "Vercel deployment failed" 
        }
        
        Write-Success "Frontend deployed successfully"
        
        # Extract URL from deployment output
        $urlPattern = "https://[\w\-]+\.vercel\.app"
        if ($deployOutput -match $urlPattern) {
            $script:FrontendUrl = $matches[0] -replace "https://", ""
            Write-Host "Frontend URL: https://$($script:FrontendUrl)" -ForegroundColor $Green
        } else {
            Write-Warning "Could not extract frontend URL from deployment output"
            Write-Host "Please check your Vercel dashboard for the deployment URL"
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
    
    if ($script:BackendUrl) {
        Write-Host "Testing backend health at: https://$($script:BackendUrl)/api/health"
        try {
            # Wait a moment for deployment to be ready
            Start-Sleep -Seconds 5
            
            $response = Invoke-WebRequest -Uri "https://$($script:BackendUrl)/api/health" -Method GET -UseBasicParsing -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend health check passed"
                $healthData = $response.Content | ConvertFrom-Json
                Write-Host "Backend info: $($healthData.message)" -ForegroundColor Cyan
            }
            else {
                Write-Error "Backend health check failed (HTTP $($response.StatusCode))"
            }
        }
        catch {
            Write-Error "Backend health check failed: $($_.Exception.Message)"
            Write-Warning "Backend may still be starting up. Check manually later."
        }
    } else {
        Write-Warning "No backend URL available for testing"
    }
    
    if ($script:FrontendUrl) {
        Write-Host "Testing frontend at: https://$($script:FrontendUrl)"
        try {
            # Wait a moment for deployment to be ready
            Start-Sleep -Seconds 3
            
            $response = Invoke-WebRequest -Uri "https://$($script:FrontendUrl)" -Method GET -UseBasicParsing -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Success "Frontend check passed"
            }
            else {
                Write-Error "Frontend check failed (HTTP $($response.StatusCode))"
            }
        }
        catch {
            Write-Error "Frontend check failed: $($_.Exception.Message)"
            Write-Warning "Frontend may still be starting up. Check manually later."
        }
    } else {
        Write-Warning "No frontend URL available for testing"
    }
}

function Show-Summary {
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor $Green
    Write-Host "========================="
    
    if ($script:BackendUrl) {
        Write-Host "Backend:  https://$($script:BackendUrl)" -ForegroundColor $White
        Write-Host "API:      https://$($script:BackendUrl)/api" -ForegroundColor $White
        Write-Host "Health:   https://$($script:BackendUrl)/api/health" -ForegroundColor $White
    } else {
        Write-Host "Backend:  Not deployed or URL not detected" -ForegroundColor $Yellow
    }
    
    if ($script:FrontendUrl) {
        Write-Host "Frontend: https://$($script:FrontendUrl)" -ForegroundColor $White
    } else {
        Write-Host "Frontend: Not deployed or URL not detected" -ForegroundColor $Yellow
    }
    
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor $Yellow
    Write-Host "1. Test all application features manually"
    Write-Host "2. Verify API endpoints are working"
    Write-Host "3. Set up monitoring and alerts"
    Write-Host "4. Configure custom domain (optional)"
    Write-Host "5. Set up CI/CD pipeline for future deployments"
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor $Blue
    Write-Host "- README.md for usage instructions"
    Write-Host "- DEPLOYMENT.md for deployment details"  
    Write-Host "- PRODUCTION-OPTIMIZATION.md for performance tuning"
    Write-Host ""
    Write-Host "🛠️ Troubleshooting:" -ForegroundColor $Cyan
    Write-Host "- If URLs are missing, check Vercel dashboard manually"
    Write-Host "- Backend may take a few minutes to start up completely"
    Write-Host "- Check environment variables are properly set"
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
    if ($MyInvocation.InvocationName -ne '.') {
        Main
    }
}
catch {
    Write-Host ""
    Write-Error "Deployment interrupted or failed: $_"
    exit 1
}