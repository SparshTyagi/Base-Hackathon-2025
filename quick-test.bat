@echo off
echo 🚀 Quick Test Setup for Swear Jar App
echo =====================================

echo 1. Checking if backend is running...
curl -s http://localhost:8080/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Backend is running
) else (
    echo    ❌ Backend is not running
    echo    Please start the backend manually:
    echo    cd logic
    echo    npm install
    echo    npm run build
    echo    npm start
    echo.
    echo    Then run this script again.
    pause
    exit /b 1
)

echo.
echo 2. Running backend API tests...
if exist node.exe (
    node test-backend.js
) else (
    echo    ❌ Node.js not found, skipping API tests
)

echo.
echo 3. Frontend Testing Instructions:
echo    📱 Your Vercel app: [Your Vercel URL]
echo    🔧 Update environment variables in Vercel:
echo       NEXT_PUBLIC_API_URL=http://localhost:8080
echo       NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
echo.
echo    🧪 Test these features:
echo       - Connect wallet
echo       - Create a piggybank
echo       - Add members and rules
echo       - Check real-time updates

echo.
echo 4. Manual API Testing:
echo    curl http://localhost:8080/health
echo    curl -X POST http://localhost:8080/groups -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"contractAddress\":\"0x1234567890123456789012345678901234567890\",\"creatorAddress\":\"0x0987654321098765432109876543210987654321\"}"

echo.
echo 🎉 Testing setup complete!
echo.
echo Next steps:
echo 1. Update Vercel environment variables
echo 2. Test frontend integration
echo 3. Check real-time functionality
echo.
echo For detailed testing, see TESTING_GUIDE.md
pause
