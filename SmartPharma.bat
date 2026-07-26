@echo off
title Smart Pharma – Full System Launcher

echo Starting Smart Pharma services...

set FRONTEND_PATH=D:\Viki\Zenith\smart-pharma-project\smart-pharma-frontend
set BACKEND_SERVER_PATH=D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\server
set AI_SERVICE_PATH=D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\ai-service
set TELEGRAM_PATH=D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\telegram-bot

REM Start backend
start "BACKEND SERVER" cmd /k "cd /d %BACKEND_SERVER_PATH% && npm run dev"

REM Start AI service
start "AI SERVICE" cmd /k "cd /d %AI_SERVICE_PATH% && venv\Scripts\activate && python main.py"

REM Start frontend
start "FRONTEND" cmd /k "cd /d %FRONTEND_PATH% && npm run dev"

REM Start telegram bot (if run_bot.bat exists -> use it, else run python)
if exist "%TELEGRAM_PATH%\run_bot.bat" (
  start "TELEGRAM BOT" cmd /k "cd /d %TELEGRAM_PATH% && call run_bot.bat"
) else (
  start "TELEGRAM BOT" cmd /k "cd /d %TELEGRAM_PATH% && venv\Scripts\activate && python main.py"
)

echo All windows launched.
pause
