#!/usr/bin/env pwsh
# demo-stop.ps1 -- Gracefully stop the OnDray CRM demo server
# Usage: .\demo-stop.ps1

Write-Host ""
Write-Host "[STOP] Stopping OnDray CRM demo server on port 3000..." -ForegroundColor Yellow

$stopped = $false
$portProcesses = netstat -ano | Select-String ":3000 " | ForEach-Object {
    $parts = $_ -split '\s+'
    $parts[-1]
} | Sort-Object -Unique

foreach ($pid in $portProcesses) {
    if ($pid -match '^\d+$' -and $pid -ne '0') {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $pid -Force
                Write-Host "[OK] Stopped: $($proc.ProcessName) (PID $pid)" -ForegroundColor Green
                $stopped = $true
            }
        } catch {}
    }
}

if (-not $stopped) {
    Write-Host "[INFO] No server found running on port 3000." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[DONE] Demo server stopped." -ForegroundColor Green
Write-Host ""
