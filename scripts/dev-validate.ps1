Write-Host "Running validation checks..."

python --version
if ($LASTEXITCODE -ne 0) { exit 1 }

node --version
if ($LASTEXITCODE -ne 0) { exit 1 }

python manage.py check
if ($LASTEXITCODE -ne 0) { exit 1 }

npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "PASS"
exit 0
