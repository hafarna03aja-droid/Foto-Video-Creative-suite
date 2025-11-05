#!/bin/bash
# Production Deployment Script for Foto Video Creative Suite

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=""
FRONTEND_URL=""

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    print_step "Checking requirements..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18 or higher is required"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_success "All requirements met"
}

setup_environment() {
    print_step "Setting up environment variables..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_warning "Backend .env file not found. Creating from example..."
        cp backend/.env.example backend/.env
        print_warning "Please edit backend/.env with your production values"
        read -p "Press enter when ready to continue..."
    fi
    
    # Frontend environment
    if [ ! -f ".env.local" ]; then
        print_warning "Frontend .env.local file not found. Creating..."
        echo "VITE_API_BASE_URL=https://your-backend-url.vercel.app/api" > .env.local
        echo "VITE_APP_NAME=Foto Video Creative Suite" >> .env.local
        echo "VITE_VERSION=1.0.0" >> .env.local
        print_warning "Please edit .env.local with your backend URL"
        read -p "Press enter when ready to continue..."
    fi
    
    print_success "Environment setup complete"
}

build_backend() {
    print_step "Building backend..."
    
    cd backend
    
    # Install dependencies
    npm ci --only=production
    
    # Build TypeScript
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Backend built successfully"
    else
        print_error "Backend build failed"
        exit 1
    fi
    
    cd ..
}

build_frontend() {
    print_step "Building frontend..."
    
    # Install dependencies
    npm ci
    
    # Build React app
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
}

deploy_backend() {
    print_step "Deploying backend..."
    
    cd backend
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to Vercel
    echo "Deploying backend to Vercel..."
    vercel --prod --confirm
    
    if [ $? -eq 0 ]; then
        print_success "Backend deployed successfully"
        BACKEND_URL=$(vercel ls | grep backend | awk '{print $2}' | head -1)
        echo "Backend URL: https://$BACKEND_URL"
    else
        print_error "Backend deployment failed"
        exit 1
    fi
    
    cd ..
}

deploy_frontend() {
    print_step "Deploying frontend..."
    
    # Update frontend environment with backend URL
    if [ ! -z "$BACKEND_URL" ]; then
        echo "VITE_API_BASE_URL=https://$BACKEND_URL/api" > .env.local
        echo "VITE_APP_NAME=Foto Video Creative Suite" >> .env.local
        echo "VITE_VERSION=1.0.0" >> .env.local
        
        # Rebuild with new backend URL
        npm run build
    fi
    
    # Deploy to Vercel
    echo "Deploying frontend to Vercel..."
    vercel --prod --confirm
    
    if [ $? -eq 0 ]; then
        print_success "Frontend deployed successfully"
        FRONTEND_URL=$(vercel ls | grep -v backend | awk '{print $2}' | head -1)
        echo "Frontend URL: https://$FRONTEND_URL"
    else
        print_error "Frontend deployment failed"
        exit 1
    fi
}

test_deployment() {
    print_step "Testing deployment..."
    
    if [ ! -z "$BACKEND_URL" ]; then
        echo "Testing backend health..."
        HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$BACKEND_URL/api/health")
        
        if [ "$HEALTH_RESPONSE" = "200" ]; then
            print_success "Backend health check passed"
        else
            print_error "Backend health check failed (HTTP $HEALTH_RESPONSE)"
        fi
    fi
    
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "Testing frontend..."
        FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_URL")
        
        if [ "$FRONTEND_RESPONSE" = "200" ]; then
            print_success "Frontend check passed"
        else
            print_error "Frontend check failed (HTTP $FRONTEND_RESPONSE)"
        fi
    fi
}

cleanup() {
    print_step "Cleaning up..."
    
    # Remove node_modules from backend (if needed for space)
    # rm -rf backend/node_modules
    
    print_success "Cleanup complete"
}

show_summary() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "========================="
    
    if [ ! -z "$BACKEND_URL" ]; then
        echo "Backend:  https://$BACKEND_URL"
        echo "API:      https://$BACKEND_URL/api"
        echo "Health:   https://$BACKEND_URL/api/health"
    fi
    
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "Frontend: https://$FRONTEND_URL"
    fi
    
    echo ""
    echo "📝 Next Steps:"
    echo "1. Test all application features"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure custom domain (optional)"
    echo "4. Set up CI/CD pipeline"
    echo ""
    echo "📚 Documentation:"
    echo "- README.md for usage instructions"
    echo "- DEPLOYMENT.md for deployment details"
    echo "- PRODUCTION-OPTIMIZATION.md for performance tuning"
}

# Main execution
main() {
    echo "🎬 Foto Video Creative Suite - Production Deployment"
    echo "=================================================="
    
    check_requirements
    setup_environment
    build_backend
    build_frontend
    deploy_backend
    deploy_frontend
    test_deployment
    cleanup
    show_summary
}

# Handle script interruption
trap 'echo -e "\n${RED}Deployment interrupted!${NC}"; exit 1' INT

# Run main function
main "$@"