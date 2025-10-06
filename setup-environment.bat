@echo off
echo ========================================
echo    Brixsport Environment Setup
echo ========================================
echo.

echo [1/4] Checking environment files...

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local not found
    echo Creating .env.local from template...
    copy ".env.example" ".env.local" >nul
    echo ✅ Created .env.local - Please edit with your actual values
) else (
    echo ✅ .env.local exists
)

REM Check backend environment
if not exist "brixsport-backend\.env" (
    if exist "brixsport-backend\.env.development" (
        echo ✅ Backend environment file exists (.env.development)
    ) else (
        echo ❌ Backend environment file not found
        echo Creating backend .env from template...
        copy "brixsport-backend\.env.example" "brixsport-backend\.env.development" >nul
        echo ✅ Created backend .env.development - Please edit with your actual values
    )
) else (
    echo ✅ Backend .env exists
)

echo.
echo [2/4] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo [3/4] Installing backend dependencies...
cd brixsport-backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed
cd ..

echo.
echo [4/4] Running type check...
call npm run type-check
if %errorlevel% neq 0 (
    echo ⚠️  Type check found issues - please review
) else (
    echo ✅ Type check passed
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Before running the application:
echo 1. Edit .env.local with your Supabase credentials
echo 2. Edit brixsport-backend\.env.development with your database credentials
echo 3. Set up your Supabase database using the migration files
echo.
echo To start development:
echo - Frontend: npm run dev
echo - Backend: cd brixsport-backend && npm run dev
echo.
pause
