#!/bin/bash

# Deployment preparation script for Vercel

echo "🚀 Preparing project for Vercel deployment..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local from template..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local and add your GEMINI_API_KEY"
fi

# Test build
echo "🔨 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Ensure .env.local has your GEMINI_API_KEY"
    echo "2. Commit and push to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    echo "   git push origin main"
    echo "3. Deploy on Vercel:"
    echo "   - Visit https://vercel.com"
    echo "   - Import your GitHub repository"
    echo "   - Add GEMINI_API_KEY environment variable"
    echo "   - Deploy!"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi