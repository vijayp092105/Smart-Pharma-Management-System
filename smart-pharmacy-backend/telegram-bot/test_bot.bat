@echo off
REM run_bot.bat - wrapper for NSSM service
SETLOCAL

REM change to the project folder
cd /d D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\telegram-bot

REM activate venv
call venv\Scripts\activate.bat

REM Set environment variables (example)
set PYTHONUNBUFFERED=1
set CHROMA_DISABLE_TELEMETRY=1
REM If you use a .env file, you can load it in Python instead of here

REM Start the bot - output goes to stdout/stderr captured by NSSM
python main.py

ENDLOCAL
