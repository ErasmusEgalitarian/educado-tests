param(
    [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"
$ambientDir = $PSScriptRoot
$manifestPath = Join-Path $ambientDir "fixtures.local.json"
if (-not (Test-Path $manifestPath)) {
    throw "fixtures.local.json ausente. Execute setup.ps1."
}

$configPath = Join-Path $ambientDir ".env.local"
if (-not $BaseUrl) {
    $baseUrl = "http://localhost:5001"
    if (Test-Path $configPath) {
        foreach ($line in Get-Content $configPath) {
            if ($line -match '^BASE_URL=(.+)$') { $baseUrl = $Matches[1].Trim(); break }
        }
    }
} else {
    $baseUrl = $BaseUrl
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$failures = @()

function Check {
    param([string]$Name, [scriptblock]$Action)
    try {
        & $Action
        Write-Host "[OK] $Name"
    } catch {
        $failures += "[FALHA] $Name`: $($_.Exception.Message)"
        Write-Host "[FALHA] $Name"
    }
}

Check "API responde" {
    Invoke-RestMethod -Uri "$baseUrl/docs/" -TimeoutSec 5 | Out-Null
}

$config = @{}
if (Test-Path $configPath) {
    foreach ($line in Get-Content $configPath) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $config[$Matches[1]] = $Matches[2].Trim()
        }
    }
}

function Login {
    param([string]$Email, [string]$Password)
    Invoke-RestMethod -Method POST -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
}

Check "ADM1 autentica" {
    $login = Login $config["ADMIN_EMAIL"] $config["ADMIN_PASSWORD"]
    if (-not $login.accessToken) { throw "Token ausente" }
}

Check "U1 autentica" {
    $login = Login $config["USER1_EMAIL"] $config["USER1_PASSWORD"]
    if (-not $login.accessToken) { throw "Token ausente" }
}

Check "U2 autentica" {
    $login = Login $config["USER2_EMAIL"] $config["USER2_PASSWORD"]
    if (-not $login.accessToken) { throw "Token ausente" }
}

Check "Perfis proprios U1, U2, A e B respondem" {
    $u1 = Login $config["USER1_EMAIL"] $config["USER1_PASSWORD"]
    $u2 = Login $config["USER2_EMAIL"] $config["USER2_PASSWORD"]
    Invoke-RestMethod -Uri "$baseUrl/me/profile" -Headers @{ Authorization = "Bearer $($u1.accessToken)" } | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/me/profile" -Headers @{ Authorization = "Bearer $($u2.accessToken)" } | Out-Null
    $a = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT1_PHONE"] } | ConvertTo-Json)
    $b = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT2_PHONE"] } | ConvertTo-Json)
    Invoke-RestMethod -Uri "$baseUrl/student/profile" -Headers @{ Authorization = "Bearer $($a.accessToken)" } | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/student/profile" -Headers @{ Authorization = "Bearer $($b.accessToken)" } | Out-Null
}

Check "ADM1 consulta cadastros" {
    $login = Login $config["ADMIN_EMAIL"] $config["ADMIN_PASSWORD"]
    Invoke-RestMethod -Uri "$baseUrl/admin/registrations" -Headers @{ Authorization = "Bearer $($login.accessToken)" } | Out-Null
}

Check "A e B autenticam" {
    $a = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT1_PHONE"] } | ConvertTo-Json)
    $b = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT2_PHONE"] } | ConvertTo-Json)
    if (-not $a.accessToken -or -not $b.accessToken) { throw "Token ausente" }
}

Check "Cursos C1 e C2 existem" {
    $u1 = Login $config["USER1_EMAIL"] $config["USER1_PASSWORD"]
    $u2 = Login $config["USER2_EMAIL"] $config["USER2_PASSWORD"]
    Invoke-RestMethod -Uri "$baseUrl/courses/$($manifest.resources.C1)" -Headers @{ Authorization = "Bearer $($u1.accessToken)" } | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/courses/$($manifest.resources.C2)" -Headers @{ Authorization = "Bearer $($u2.accessToken)" } | Out-Null
    try {
        Invoke-RestMethod -Uri "$baseUrl/courses/$($manifest.resources.C2)" -Headers @{ Authorization = "Bearer $($u1.accessToken)" } | Out-Null
        throw "U1 conseguiu consultar C2"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw "U1 nao recebeu 403 em C2" }
    }
    try {
        Invoke-RestMethod -Uri "$baseUrl/courses/$($manifest.resources.C1)" -Headers @{ Authorization = "Bearer $($u2.accessToken)" } | Out-Null
        throw "U2 conseguiu consultar C1"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw "U2 nao recebeu 403 em C1" }
    }
}

Check "Matriculas A/C1 e B/C2 existem" {
    $a = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT1_PHONE"] } | ConvertTo-Json)
    $b = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT2_PHONE"] } | ConvertTo-Json)
    $aEnrollments = Invoke-RestMethod -Uri "$baseUrl/student/enrollments" -Headers @{ Authorization = "Bearer $($a.accessToken)" }
    $bEnrollments = Invoke-RestMethod -Uri "$baseUrl/student/enrollments" -Headers @{ Authorization = "Bearer $($b.accessToken)" }
    if ($aEnrollments.enrollments.courseId -notcontains $manifest.resources.C1) { throw "A não está matriculado em C1" }
    if ($bEnrollments.enrollments.courseId -notcontains $manifest.resources.C2) { throw "B não está matriculado em C2" }
    if ($aEnrollments.enrollments.courseId -contains $manifest.resources.C2) { throw "A possui matricula cruzada em C2" }
    if ($bEnrollments.enrollments.courseId -contains $manifest.resources.C1) { throw "B possui matricula cruzada em C1" }
}

Check "Progresso e certificados independentes existem" {
    $a = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT1_PHONE"] } | ConvertTo-Json)
    $b = Invoke-RestMethod -Method POST -Uri "$baseUrl/student/auth/phone-login" -ContentType "application/json" -Body (@{ phone = $config["STUDENT2_PHONE"] } | ConvertTo-Json)
    $progressA = Invoke-RestMethod -Uri "$baseUrl/student/progress/courses/$($manifest.resources.C1)" -Headers @{ Authorization = "Bearer $($a.accessToken)" }
    $progressB = Invoke-RestMethod -Uri "$baseUrl/student/progress/courses/$($manifest.resources.C2)" -Headers @{ Authorization = "Bearer $($b.accessToken)" }
    $certificatesA = Invoke-RestMethod -Uri "$baseUrl/student/certificates" -Headers @{ Authorization = "Bearer $($a.accessToken)" }
    $certificatesB = Invoke-RestMethod -Uri "$baseUrl/student/certificates" -Headers @{ Authorization = "Bearer $($b.accessToken)" }
    if ($progressA.progressPercent -ne 100) { throw "Progresso de A nao esta completo" }
    if ($progressB.progressPercent -ne 100) { throw "Progresso de B nao esta completo" }
    if (@($certificatesA.certificates).Count -lt 1) { throw "A nao possui certificado" }
    if (@($certificatesB.certificates).Count -lt 1) { throw "B nao possui certificado" }
    $idsA = @($certificatesA.certificates | ForEach-Object { $_.id })
    $idsB = @($certificatesB.certificates | ForEach-Object { $_.id })
    if (($idsA | Where-Object { $idsB -contains $_ }).Count -gt 0) { throw "A e B compartilham certificado" }
}

Check "Midias proprietarias existem" {
    $u1 = Login $config["USER1_EMAIL"] $config["USER1_PASSWORD"]
    $u2 = Login $config["USER2_EMAIL"] $config["USER2_PASSWORD"]
    $mediaU1 = Invoke-RestMethod -Uri "$baseUrl/me/media" -Headers @{ Authorization = "Bearer $($u1.accessToken)" }
    $mediaU2 = Invoke-RestMethod -Uri "$baseUrl/me/media" -Headers @{ Authorization = "Bearer $($u2.accessToken)" }
    $idsU1 = @($mediaU1.items | ForEach-Object { $_.id })
    $idsU2 = @($mediaU2.items | ForEach-Object { $_.id })
    if ($idsU1 -notcontains $manifest.resources.Img1) { throw "Img1 nao pertence a U1" }
    if ($idsU1 -notcontains $manifest.resources.ImgInactive1) { throw "midia INACTIVE nao pertence a U1" }
    if ($idsU2 -notcontains $manifest.resources.Img2) { throw "Img2 nao pertence a U2" }
    $inactiveU1 = Invoke-RestMethod -Uri "$baseUrl/me/media?status=INACTIVE" -Headers @{ Authorization = "Bearer $($u1.accessToken)" }
    $inactiveIds = @($inactiveU1.items | ForEach-Object { $_.id })
    if ($inactiveIds -notcontains $manifest.resources.ImgInactive1) { throw "status INACTIVE nao foi confirmado" }
}

Check "Estados MP, MNP e MI ficam distinguiveis" {
    $u1 = Login $config["USER1_EMAIL"] $config["USER1_PASSWORD"]
    $u2 = Login $config["USER2_EMAIL"] $config["USER2_PASSWORD"]
    $c1 = Invoke-RestMethod -Uri "$baseUrl/courses/$($manifest.resources.C1)" -Headers @{ Authorization = "Bearer $($u1.accessToken)" }
    if ($c1.imageMediaId -ne $manifest.resources.MP) { throw "MP nao esta associada a C1" }

    $mp = Invoke-RestMethod -Uri "$baseUrl/me/media?status=ACTIVE" -Headers @{ Authorization = "Bearer $($u1.accessToken)" }
    $mnp = Invoke-RestMethod -Uri "$baseUrl/me/media?status=ACTIVE" -Headers @{ Authorization = "Bearer $($u2.accessToken)" }
    $mpIds = @($mp.items | ForEach-Object { $_.id })
    $mnpIds = @($mnp.items | ForEach-Object { $_.id })
    if ($mpIds -notcontains $manifest.resources.MP) { throw "MP nao esta ACTIVE" }
    if ($mnpIds -notcontains $manifest.resources.MNP) { throw "MNP nao esta ACTIVE" }
    if ($c1.imageMediaId -eq $manifest.resources.MNP) { throw "MNP foi associada indevidamente a C1" }

    $mi = Invoke-RestMethod -Uri "$baseUrl/me/media?status=INACTIVE" -Headers @{ Authorization = "Bearer $($u1.accessToken)" }
    $miIds = @($mi.items | ForEach-Object { $_.id })
    if ($miIds -notcontains $manifest.resources.MI) { throw "MI nao esta INACTIVE" }
}

if ($failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Bloqueio operacional: nenhuma falha acima deve ser interpretada como falha de autorizacao."
    $failures | ForEach-Object { Write-Host $_ }
    exit 1
}

Write-Host ""
Write-Host "Ambiente verificavel; resultados de autorizacao ainda nao executados."
