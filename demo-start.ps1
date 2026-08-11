#!/usr/bin/env pwsh
# demo-start.ps1 — Start the OnDray CRM demo server
# Usage: .\demo-start.ps1
# Run from the project root. The app will open at http://127.0.0.1:3000/

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  OnDray — Drayage Customer Onboarding CRM" -ForegroundColor Cyan
Write-Host "  DEMO START" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check node_modules exists
if (-not (Test-Path ".\node_modules")) {
    Write-Host "[SETUP] node_modules not found. Running npm ci..." -ForegroundColor Yellow
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm ci failed. Check your Node.js installation." -ForegroundColor Red
        exit 1
    }
}

# Check .env exists
if (-not (Test-Path ".\.env")) {
    Write-Host "[ERROR] .env file not found. Copy .env.example and fill in credentials." -ForegroundColor Red
    exit 1
}

# Check Supabase URL is configured
$envContent = Get-Content ".\.env" -Raw
if ($envContent -notmatch "VITE_SUPABASE_URL=.https://") {
    Write-Host "[WARNING] VITE_SUPABASE_URL does not look like a cloud Supabase URL." -ForegroundColor Yellow
    Write-Host "  Verify .env is configured correctly before presenting." -ForegroundColor Yellow
}

Write-Host "[OK] Pre-flight checks passed." -ForegroundColor Green
Write-Host ""
Write-Host "[START] Starting Vite dev server on http://127.0.0.1:3000/" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

# Open browser after a short delay (background job)
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 4
    Start-Process "http://127.0.0.1:3000/"
} | Out-Null

# Start the dev server (foreground)
npm run dev
