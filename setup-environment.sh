#!/bin/bash

echo "========================================"
echo "    Brixsport Environment Setup"
echo "========================================"
echo

echo "[1/4] Checking environment files..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found"
    echo "Creating .env.local from template..."
    cp ".env.example" ".env.local"
    echo "✅ Created .env.local - Please edit with your actual values"
else
    echo "✅ .env.local exists"
fi

# Check backend environment
if [ ! -f "brixsport-backend/.env" ]; then
    if [ -f "brixsport-backend/.env.development" ]; then
        echo "✅ Backend environment file exists (.env.development)"
    else
        echo "❌ Backend environment file not found"
        echo "Creating backend .env from template..."
        cp "brixsport-backend/.env.example" "brixsport-backend/.env.development"
        echo "✅ Created backend .env.development - Please edit with your actual values"
    fi
else
    echo "✅ Backend .env exists"
fi

echo
echo "[2/4] Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"

echo
echo "[3/4] Installing backend dependencies..."
cd brixsport-backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi
echo "✅ Backend dependencies installed"
cd ..

echo
echo "[4/4] Running type check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "⚠️  Type check found issues - please review"
else
    echo "✅ Type check passed"
fi

echo
echo "========================================"
echo "    Setup Complete!"
echo "========================================"
echo
echo "IMPORTANT: Before running the application:"
echo "1. Edit .env.local with your Supabase credentials"
echo "2. Edit brixsport-backend/.env.development with your database credentials"
echo "3. Set up your Supabase database using the migration files"
echo
echo "To start development:"
echo "- Frontend: npm run dev"
echo "- Backend: cd brixsport-backend && npm run dev"
echo
