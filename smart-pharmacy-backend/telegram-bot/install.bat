@echo off
echo Installing Telegram Bot dependencies...
echo =======================================
echo.

REM Check Python version
python --version

REM Create virtual environment
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
python -m pip install --upgrade pip

REM Install dependencies
pip install python-telegram-bot==20.6
pip install psycopg2-binary==2.9.9
pip install python-dotenv==1.0.0
pip install schedule==1.2.0

echo.
echo Installation complete!
echo.
echo Next steps:
echo   1. Edit the .env file with your Telegram bot token and database credentials
echo   2. Run: python main.py
echo.

pause
