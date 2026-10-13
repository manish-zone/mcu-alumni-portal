@echo off
:: ============================================================
:: MCU Alumni Portal — Unified Microservices Backend Startup
:: ============================================================
:: Runs all microservices unified on a SINGLE PORT (Port 8000)
::
:: Modules communicating on Port 8000:
::   • Auth Microservice        (/api/auth/*)
::   • Alumni & Meta Service    (/api/alumni/*, /api/meta/*)
::   • Events Service           (/api/events/*)
::   • Jobs & Referrals Service (/api/jobs/*)
::   • Engagement Service       (/api/mentorship/*, /api/memories, /api/giving/*)
:: ============================================================

echo.
echo =========================================================
echo   MCU Alumni Portal — Unified Microservices Backend
echo   (All services running together on Port 8000)
echo =========================================================
echo.

cd /d "%~dp0"

echo [1/2] Building Unified Microservices binary...
go build -o bin\microservices.exe .\cmd\microservices
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to compile backend service.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Starting Backend Service on http://localhost:8000...
echo.
echo  • API Base URL:       http://localhost:8000/api
echo  • Health Check:       http://localhost:8000/api/health
echo  • Service Registry:   http://localhost:8000/api/services
echo  • Service Dashboard:  http://localhost:8000/
echo  • Frontend Portal:    http://localhost:5173
echo.
echo =========================================================
echo.

bin\microservices.exe
