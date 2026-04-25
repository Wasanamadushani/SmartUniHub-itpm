# Restart Backend Server Script
Write-Host "🔄 Restarting Backend Server..." -ForegroundColor Cyan

# Find and kill process on port 5001
Write-Host "🔍 Checking for existing process on port 5001..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Write-Host "⚠️  Found process $process using port 5001" -ForegroundColor Yellow
    Write-Host "🛑 Stopping process..." -ForegroundColor Red
    Stop-Process -Id $process -Force
    Start-Sleep -Seconds 1
    Write-Host "✅ Process stopped" -ForegroundColor Green
} else {
    Write-Host "✅ Port 5001 is free" -ForegroundColor Green
}

# Start the server
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
npm start
