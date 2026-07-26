Write-Host "Starting Smart Pharma System..."

$frontend = "D:\Viki\Zenith\smart-pharma-project\smart-pharma-frontend"
$backend = "D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\server"
$ai = "D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\ai-service"
$telegram = "D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\telegram-bot"

# Start Backend (Node.js)
Start-Process powershell -ArgumentList "cd '$backend'; npm run dev" -WindowStyle Normal

# Start AI Service (Python FastAPI)
Start-Process powershell -ArgumentList "cd '$ai'; venv\Scripts\activate; python main.py" -WindowStyle Normal

# Start Frontend (Vite)
Start-Process powershell -ArgumentList "cd '$frontend'; npm run dev" -WindowStyle Normal

# Start Telegram Bot (wrapper run_bot.bat or direct python)
# If you have run_bot.bat ready that activates venv and runs main.py, run that.
$runBotBat = Join-Path $telegram 'run_bot.bat'
if (Test-Path $runBotBat) {
    Start-Process cmd -ArgumentList "/k `"$runBotBat`"" -WindowStyle Normal
} else {
    # fallback: activate venv and run python main.py directly
    Start-Process powershell -ArgumentList "cd '$telegram'; venv\Scripts\activate; python main.py" -WindowStyle Normal
}

Write-Host "All services launched."
