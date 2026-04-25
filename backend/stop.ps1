# Stop Backend Server Script
Write-Host "🛑 Stopping Backend Server..." -ForegroundColor Red

# Find and kill process on port 5001
$process = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Write-Host "⚠️  Found process $process using port 5001" -ForegroundColor Yellow
    Stop-Process -Id $process -Force
    Write-Host "✅ Backend server stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No process found on port 5001" -ForegroundColor Cyan
}
