@echo off
echo ===================================================================
echo   Saathi — Tuberculosis Treatment Adherence & Dropout Prevention
echo ===================================================================
echo.
cd /d "%~dp0"

echo [1/3] Checking Node.js and npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js is not installed or not in PATH.
    echo Opening standalone preview in browser instead...
    start "" "preview.html"
    pause
    exit /b
)

echo [2/3] Checking backend dependencies...
if not exist "node_modules\express\" (
    echo.
    echo Backend dependencies not found! Installing required packages...
    echo (Express, Prisma, ioredis, Sharp, Tsx, Jest, etc. - may take 1-2 minutes)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [!] npm install encountered an error. Please check your internet connection.
        pause
        exit /b
    )
    echo.
    echo Generating Prisma Client...
    call npx prisma generate
    echo Dependencies successfully installed!
    echo.
)

echo [3/3] Ready to launch!
echo.
echo Please choose an option:
echo   [1] Start Backend API on port 5000 (Swagger docs at http://localhost:5000/docs)
echo   [2] Start BOTH Frontend (Port 3000) and Backend API (Port 5000)
echo   [3] Start Database (PostgreSQL + Redis via Docker Compose)
echo   [4] Seed Database with 200 patients (npm run seed)
echo   [5] Run Automated Test Suites (npm test)
echo.
set /p choice="Enter option [1-5] (default is 1): "

if "%choice%"=="2" (
    echo.
    echo Starting Frontend (:3000) and Backend (:5000)...
    echo Frontend: http://localhost:3000
    echo Swagger Docs: http://localhost:5000/docs
    call npm run dev:all
) else if "%choice%"=="3" (
    echo.
    echo Starting PostgreSQL and Redis containers...
    docker compose up -d postgres redis
    echo Containers started! Now run Option 4 to seed the database.
    pause
) else if "%choice%"=="4" (
    echo.
    echo Seeding database with 200 synthetic patients...
    call npm run seed
    pause
) else if "%choice%"=="5" (
    echo.
    echo Running automated test suites...
    call npm test
    pause
) else (
    echo.
    echo Starting Saathi Backend API on http://localhost:5000...
    echo Swagger Documentation will be available at: http://localhost:5000/docs
    echo Health Status will be available at: http://localhost:5000/health
    echo Press Ctrl+C in this window to stop the server.
    echo.
    call npm run dev
)

pause
