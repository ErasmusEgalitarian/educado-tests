$ErrorActionPreference = "Stop"
$ambientDir = $PSScriptRoot
$envPath = Join-Path $ambientDir ".env.local"
$manifestPath = Join-Path $ambientDir "fixtures.local.json"
$composeOverride = Join-Path $ambientDir "docker-compose.minio.override.yml"
$evidencePath = Join-Path $ambientDir "evidence.local.json"

$existingApi = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue
foreach ($connection in $existingApi) {
    $pidToStop = $connection.OwningProcess
    if ($pidToStop -gt 0) {
        Stop-Process -Id $pidToStop -Force
    }
}

$ApiDir = ""
if (Test-Path $envPath) {
    foreach ($line in Get-Content $envPath) {
        if ($line -match '^API_DIR=(.+)$') { $ApiDir = $Matches[1].Trim(); break }
    }
}

if (-not $ApiDir) {
    $ApiDir = "../../../../educado-api"
}
if (-not [System.IO.Path]::IsPathRooted($ApiDir)) {
    $ApiDir = Join-Path $ambientDir $ApiDir
}
$ApiDir = (Resolve-Path $ApiDir).Path

Push-Location $ApiDir
try {
    docker compose -f docker-compose.yml -f $composeOverride down -v
} finally {
    Pop-Location
}

Remove-Item $manifestPath -ErrorAction SilentlyContinue
Remove-Item $evidencePath -ErrorAction SilentlyContinue
Write-Host "Volumes removidos e manifesto local excluido."
