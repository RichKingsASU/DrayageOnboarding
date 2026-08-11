#!/usr/bin/env pwsh
# demo-status.ps1 - Quick health check for the OnDray CRM demo environment
# Usage: .\demo-status.ps1
# Run from the project root.

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  OnDray CRM -- DEMO STATUS CHECK" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# 1. Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Node.js not found" -ForegroundColor Red
    $allOk = $false
}

# 2. Check .env file
if (Test-Path ".\.env") {
    Write-Host "[OK] .env file present" -ForegroundColor Green
} else {
    Write-Host "[FAIL] .env file missing -- copy .env.example and configure" -ForegroundColor Red
    $allOk = $false
}

# 3. Check node_modules
if (Test-Path ".\node_modules") {
    Write-Host "[OK] node_modules present" -ForegroundColor Green
} else {
    Write-Host "[FAIL] node_modules missing -- run: npm ci" -ForegroundColor Red
    $allOk = $false
}

# 4. Check if dev server is running on port 3000
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Dev server responding on http://127.0.0.1:3000/ (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[DOWN] Dev server not responding on port 3000 -- run .\demo-start.ps1" -ForegroundColor Yellow
    $allOk = $false
}

# 5. Check Supabase cloud reachability
try {
    $envContent = Get-Content ".\.env" -Raw
    if ($envContent -match 'VITE_SUPABASE_URL="(https://[^"]+)"') {
        $supabaseUrl = $matches[1]
        $healthUrl = "$supabaseUrl/rest/v1/"
        try {
            $resp = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Write-Host "[OK] Supabase cloud reachable: $supabaseUrl" -ForegroundColor Green
        } catch [System.Net.WebException] {
            # 401 Unauthorized = server is up, auth headers required (expected for unauthenticated probe)
            if ($_.Exception.Response -and $_.Exception.Response.StatusCode -eq 401) {
                Write-Host "[OK] Supabase cloud reachable (auth required): $supabaseUrl" -ForegroundColor Green
            } else {
                Write-Host "[WARN] Supabase cloud connectivity check failed -- verify network" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "[WARN] Could not parse VITE_SUPABASE_URL from .env" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Supabase cloud connectivity check failed -- verify network" -ForegroundColor Yellow
}

# 6. Check disk space
$drive = Get-PSDrive -PSProvider FileSystem C
$freeGB = [math]::Round($drive.Free / 1GB, 1)
if ($freeGB -gt 5) {
    Write-Host "[OK] Disk free: ${freeGB}GB" -ForegroundColor Green
} else {
    Write-Host "[WARN] Low disk space: ${freeGB}GB free" -ForegroundColor Yellow
}

Write-Host ""
if ($allOk) {
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host "  ALL CHECKS PASSED -- READY FOR DEMO" -ForegroundColor Green
    Write-Host "  Open: http://127.0.0.1:3000/" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
} else {
    Write-Host "=================================================" -ForegroundColor Yellow
    Write-Host "  SOME CHECKS FAILED -- Review items above" -ForegroundColor Yellow
    Write-Host "=================================================" -ForegroundColor Yellow
}
Write-Host ""
