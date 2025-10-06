@echo off

echo Starting Brixsport services directly (without Docker)...

echo.
echo Checking Python dependencies...
cd /d "%~dp0\..\apps\analytics"
python -c "import fastapi, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r requirements-direct.txt
) else (
    echo Python dependencies already installed.
)

echo.
echo Starting API service...
cd /d "%~dp0\..\apps\api"
start "API Service" cmd /k "npm run dev"

echo.
echo Starting Analytics service...
cd /d "%~dp0\..\apps\analytics"
start "Analytics Service" cmd /k "python -m uvicorn main:app --reload --port 8000"

echo.
echo Both services started!
echo API service running on http://localhost:4000
echo Analytics service running on http://localhost:8000
echo Press any key to exit...
pause >nul