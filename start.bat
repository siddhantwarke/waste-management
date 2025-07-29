@echo off
REM Waste Management App Startup Script for Windows

echo 🚀 Starting Waste Management App...
echo ==================================

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm -v >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install backend dependencies if needed
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

REM Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo 🔧 Starting Backend Server...
cd backend
start "Backend Server" cmd /k "node server.js"
cd ..

echo 🎨 Starting Frontend Server...
cd frontend
start "Frontend Server" cmd /k "npm start"
cd ..

echo 🌟 Application is starting!
echo ==================================
echo Backend Server: http://localhost:5000
echo Frontend App: http://localhost:3000
echo ==================================
echo Press any key to exit...
pause
