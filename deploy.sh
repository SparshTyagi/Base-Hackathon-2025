#!/bin/bash

echo "🚀 Deploying Swear Jar Miniapp to Base..."

# Step 1: Build and deploy frontend
echo "📦 Building frontend..."
cd frontend
npm run build

echo "🌐 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    echo "Then run: vercel --prod"
fi

# Step 2: Deploy backend
echo "🔧 Building backend..."
cd ../logic
npm run build

echo "🚀 Backend ready for deployment!"
echo "Deploy to Railway or Render using their CLI or dashboard."

echo "✅ Deployment setup complete!"
echo "📋 Next steps:"
echo "1. Deploy frontend to Vercel"
echo "2. Deploy backend to Railway/Render"
echo "3. Update environment variables"
echo "4. Test your miniapp!"
