Write-Host "Starting Smart Pharma System..."

$frontend = "D:\Viki\Zenith\smart-pharma-project\smart-pharma-frontend"
$backend = "D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\server"
$ai = "D:\Viki\Zenith\smart-pharma-project\smart-pharmacy-backend\ai-service"

# Start Backend (Node.js)
Start-Process powershell -ArgumentList "cd '$backend'; npm run dev" -WindowStyle Normal

# Start AI Service (Python FastAPI)
Start-Process powershell -ArgumentList "cd '$ai'; venv\Scripts\activate; python main.py" -WindowStyle Normal

# Start Frontend (Vite)
Start-Process powershell -ArgumentList "cd '$frontend'; npm run dev" -WindowStyle Normal

Write-Host "All services launched successfully."
