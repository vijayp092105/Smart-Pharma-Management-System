@echo off
REM run_bot.bat - wrapper to safely start telegram bot (Windows)
SETLOCAL

SET BOT_DIR=%~dp0
CD /D "%BOT_DIR%"

REM python executable in venv
SET PY=venv\Scripts\python.exe
IF NOT EXIST "%PY%" (
  ECHO Python executable not found at %PY%. Activate venv or edit this script.
  PAUSE
  EXIT /B 1
)

REM Check if main.py is already running
REM uses tasklist to list python processes and then wmic to get commandline (wmic may be deprecated on Win11; fallback to tasklist+find)
tasklist /FI "IMAGENAME eq python.exe" /NH | findstr /I "python.exe" >nul
IF ERRORLEVEL 1 (
    REM no python processes, safe to start
) ELSE (
    REM There are python processes; check command lines for main.py
    for /f "tokens=*" %%P in ('wmic process where "name='python.exe' or name='python3.exe'" get CommandLine ^| findstr /I "main.py"') do (
        echo Found running python that references main.py: %%P
        echo Please stop the running bot before starting a new instance.
        PAUSE
        ENDLOCAL
        EXIT /B 0
    )
)

REM Activate venv and run main.py
call venv\Scripts\activate.bat
echo Starting Telegram bot...
"%PY%" main.py
ENDLOCAL
