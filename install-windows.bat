@echo off
echo ========================================
echo Document Management System Installer
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Minimum version required: 16.0.0
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed!
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
echo ========================

:: Install dependencies
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!

:: Create environment file
echo.
echo Creating environment configuration...
echo =====================================

if not exist .env (
    copy .env.example .env
    echo Environment file created from template.
    echo Please edit .env file to configure your settings.
) else (
    echo Environment file already exists.
)

:: Create necessary directories
echo.
echo Creating directories...
echo =======================

if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "uploads\documents" mkdir uploads\documents
if not exist "uploads\thumbnails" mkdir uploads\thumbnails
if not exist "uploads\branding" mkdir uploads\branding
if not exist "uploads\temp" mkdir uploads\temp

echo Directories created successfully!

:: Check if SQLite is accessible
echo.
echo Checking database connectivity...
echo =================================

node -e "const sqlite3 = require('sqlite3'); console.log('SQLite3 is available');" >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: SQLite3 might not be properly installed.
    echo This might cause issues with the database.
)

:: Initialize database
echo.
echo Initializing database...
echo ========================

npm run migrate >nul 2>&1
if %errorlevel% neq 0 (
    echo Note: Database migration will run on first startup.
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Edit the .env file to configure your settings
echo 2. Run 'npm start' to launch the application
echo 3. Or run 'npm run dev' for development mode
echo.
echo To build the application for distribution:
echo - Run 'npm run dist' to create Windows installer
echo - The installer will be created in the 'dist' folder
echo.
echo For production deployment:
echo 1. Set NODE_ENV=production in .env
echo 2. Configure email settings for notifications
echo 3. Update admin credentials in .env
echo.
pause