@echo off
:: ============================================================
:: MCU Alumni Portal — Start Backend (Port 8000)
:: ============================================================
cd /d "%~dp0backend"
call start-microservices.bat
