#!/bin/bash

# Quick testing script for Swear Jar App
echo "🚀 Quick Test Setup for Swear Jar App"
echo "====================================="

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is not running"
    echo "   Starting backend..."
    cd logic
    npm install
    npm run build
    npm start &
    BACKEND_PID=$!
    echo "   Backend started with PID: $BACKEND_PID"
    echo "   Waiting for backend to start..."
    sleep 5
    
    # Check again
    if curl -s http://localhost:8080/health > /dev/null; then
        echo "   ✅ Backend is now running"
    else
        echo "   ❌ Failed to start backend"
        exit 1
    fi
fi

echo ""
echo "2. Running backend API tests..."
if command -v node &> /dev/null; then
    node test-backend.js
else
    echo "   ❌ Node.js not found, skipping API tests"
fi

echo ""
echo "3. Testing WebSocket connection..."
if command -v node &> /dev/null && [ -f "node_modules/ws/package.json" ]; then
    node test-websocket.js
else
    echo "   ⚠️  WebSocket library not installed"
    echo "   Run: cd logic && npm install"
fi

echo ""
echo "4. Frontend Testing Instructions:"
echo "   📱 Your Vercel app: [Your Vercel URL]"
echo "   🔧 Update environment variables in Vercel:"
echo "      NEXT_PUBLIC_API_URL=http://localhost:8080"
echo "      NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws"
echo ""
echo "   🧪 Test these features:"
echo "      - Connect wallet"
echo "      - Create a piggybank"
echo "      - Add members and rules"
echo "      - Check real-time updates"

echo ""
echo "5. Manual API Testing:"
echo "   curl http://localhost:8080/health"
echo "   curl -X POST http://localhost:8080/groups -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"contractAddress\":\"0x1234567890123456789012345678901234567890\",\"creatorAddress\":\"0x0987654321098765432109876543210987654321\"}'"

echo ""
echo "🎉 Testing setup complete!"
echo ""
echo "Next steps:"
echo "1. Update Vercel environment variables"
echo "2. Test frontend integration"
echo "3. Check real-time functionality"
echo ""
echo "For detailed testing, see TESTING_GUIDE.md"
