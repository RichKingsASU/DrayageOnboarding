#!/usr/bin/env pwsh
# demo-restart.ps1 -- Restart the OnDray CRM dev server cleanly
# Usage: .\demo-restart.ps1
# Kills any node process on port 3000 and restarts the Vite dev server.

Write-Host ""
Write-Host "[RESTART] Stopping any existing Vite server on port 3000..." -ForegroundColor Yellow

# Find and kill processes using port 3000
$portProcesses = netstat -ano | Select-String ":3000 " | ForEach-Object {
    $parts = $_ -split '\s+'
    $parts[-1]
} | Sort-Object -Unique

foreach ($pid in $portProcesses) {
    if ($pid -match '^\d+$' -and $pid -ne '0') {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "[OK] Stopped process PID $pid on port 3000" -ForegroundColor Green
        } catch {}
    }
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[START] Restarting Vite server on http://127.0.0.1:3000/" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

npm run dev
