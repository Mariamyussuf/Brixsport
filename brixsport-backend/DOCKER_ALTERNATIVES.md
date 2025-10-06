# Docker Alternatives for Brixsport Backend

This document describes the alternatives to Docker that have been implemented for the Brixsport backend development environment.

## Problem
Docker may not work properly on some systems due to specification issues or compatibility problems.

## Solution
We've implemented several alternatives to Docker for running the Brixsport backend services directly on the host system.

## Implemented Alternatives

### 1. Direct Execution Scripts

#### Windows Batch Script
- File: [scripts/dev-direct.bat](file:///c%3A/Users/LENOVO/OneDrive/Desktop/Brixsport/brixsport-backend/scripts/dev-direct.bat)
- Usage: `npm run dev:direct:windows`
- Automatically checks and installs Python dependencies if needed
- Starts both API and Analytics services in separate command windows

#### Unix Shell Script
- File: [scripts/dev-direct.sh](file:///c%3A/Users/LENOVO/OneDrive/Desktop/Brixsport/brixsport-backend/scripts/dev-direct.sh)
- Usage: `./scripts/dev-direct.sh`
- Automatically checks and installs Python dependencies if needed
- Starts both services and handles cleanup on exit

### 2. NPM Scripts

#### Concurrent Execution (Cross-platform)
- Command: `npm run dev:direct`
- Uses the `concurrently` package to run both services in the same terminal window

#### Individual Service Execution
- API Service: `npm run dev:api:direct`
- Analytics Service: `npm run dev:analytics:direct`

### 3. Simplified Python Requirements

#### Pre-compiled Packages
- File: [apps/analytics/requirements-direct.txt](file:///c%3A/Users/LENOVO/OneDrive/Desktop/Brixsport/brixsport-backend/apps/analytics/requirements-direct.txt)
- Uses pre-compiled packages to avoid build issues on Windows
- Avoids the need for build tools like Visual Studio

## Usage Instructions

### Quick Start
1. Run `npm run setup` to install Node.js dependencies
2. Choose one of the following options:

#### Option 1: Windows Batch Script (Recommended for Windows)
```bash
npm run dev:direct:windows
```

#### Option 2: Cross-platform Concurrent Execution
```bash
npm run dev:direct
```

#### Option 3: Manual Execution
```bash
# In one terminal
cd apps/api
npm run dev

# In another terminal
cd apps/analytics
python -m uvicorn main:app --reload --port 8000
```

## Services Information

- **API Service**: Runs on http://localhost:4000
- **Analytics Service**: Runs on http://localhost:8000

## Benefits of This Approach

1. **No Docker Required**: Runs directly on the host system
2. **Cross-platform**: Works on Windows, macOS, and Linux
3. **Automatic Dependency Management**: Scripts check and install dependencies as needed
4. **Easy to Debug**: Services run directly without containerization
5. **Resource Efficient**: Uses system resources directly without container overhead

## Troubleshooting

### Python Dependencies
If you encounter issues with Python dependencies:
1. Make sure Python 3.7+ is installed
2. Make sure pip is available
3. Run `pip install -r apps/analytics/requirements-direct.txt` manually

### PATH Issues
If you get "command not found" errors:
1. Make sure Node.js is installed and in your PATH
2. Make sure Python is installed and in your PATH
3. Add Python scripts directory to PATH if needed:
   - Usually located at: `C:\Users\[Username]\AppData\Roaming\Python\Python3x\Scripts`

### Port Conflicts
If ports 4000 or 8000 are already in use:
1. Stop the processes using those ports
2. Or modify the startup scripts to use different ports