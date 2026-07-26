@echo off
echo Starting Smart Pharmacy Backend Services...
echo ===========================================

REM Start AI Service
echo Starting AI Service...
cd ai-service
call venv\Scripts\activate
start "AI Service" python main.py
cd ..

REM Wait for AI service to start
timeout /t 5 /nobreak >nul

REM Start Node.js Server
echo Starting Node.js Server...
cd server
start "Node.js Server" npm run dev
cd ..

echo.
echo Services started:
echo - AI Service: http://localhost:8000
echo - Node.js Server: http://localhost:5000
echo.
echo Close windows to stop services
pause