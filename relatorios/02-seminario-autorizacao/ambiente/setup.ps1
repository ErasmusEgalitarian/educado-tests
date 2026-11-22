param(
    [string]$ApiDir = ""
)

$ErrorActionPreference = "Stop"
$ambientDir = $PSScriptRoot

function Read-EnvLocal {
    $values = @{}
    $envPath = Join-Path $ambientDir ".env.local"
    if (-not (Test-Path $envPath)) {
        Copy-Item (Join-Path $ambientDir ".env.example") $envPath
    }
    foreach ($line in Get-Content $envPath) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $values[$Matches[1]] = $Matches[2].Trim()
        }
    }
    return $values
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [string]$Token = ""
    )
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    if ($null -eq $Body) {
        return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers
    }
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10)
}

$config = Read-EnvLocal
if (-not $ApiDir) {
    $ApiDir = $config["API_DIR"]
    if (-not $ApiDir) {
        $repoRoot = Resolve-Path (Join-Path $ambientDir "../../../..")
        $ApiDir = Join-Path $repoRoot "..\educado-api"
    } elseif (-not [System.IO.Path]::IsPathRooted($ApiDir)) {
        $ApiDir = Join-Path $ambientDir $ApiDir
    }
}
$ApiDir = (Resolve-Path $ApiDir).Path
$composeOverride = Join-Path $ambientDir "docker-compose.minio.override.yml"
$baseUrl = $config["BASE_URL"]

Write-Host "API: $ApiDir"
Write-Host "Base URL: $baseUrl"

$existingApi = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue
foreach ($connection in $existingApi) {
    $pidToStop = $connection.OwningProcess
    if ($pidToStop -gt 0) {
        Stop-Process -Id $pidToStop -Force
    }
}

Push-Location $ApiDir
try {
    docker compose -f docker-compose.yml -f $composeOverride down -v
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao limpar o ambiente anterior"
    }
} finally {
    Pop-Location
}

Push-Location $ApiDir
try {
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Host "Copiado .env.example para .env"
    }
    $apiEnv = Get-Content ".env"
    $apiEnv = $apiEnv -replace '^S3_ACCESS_KEY=.*$', 'S3_ACCESS_KEY=educado-authz'
    $apiEnv = $apiEnv -replace '^S3_SECRET_KEY=.*$', 'S3_SECRET_KEY=educado-authz-storage-secret'
    $apiEnv | Set-Content ".env" -Encoding UTF8

    npm ci
    docker compose -f docker-compose.yml -f $composeOverride up -d postgres redis
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao iniciar PostgreSQL ou Redis"
    }
    docker compose -f docker-compose.yml -f $composeOverride up -d minio
    if ($LASTEXITCODE -ne 0) {
        throw "Bloqueio operacional: o MinIO nao ficou disponivel; revise a imagem/registro e nao crie fixtures sem storage verificavel"
    }

    $minioReady = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            Invoke-RestMethod -Uri "http://localhost:9002/minio/health/live" -TimeoutSec 2 | Out-Null
            $minioReady = $true
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    if (-not $minioReady) {
        throw "Bloqueio operacional: o MinIO nao respondeu na porta 9002"
    }

    node -e "const {S3Client,ListBucketsCommand,CreateBucketCommand}=require('@aws-sdk/client-s3'); const c=new S3Client({region:'us-east-1',endpoint:'http://localhost:9002',forcePathStyle:true,credentials:{accessKeyId:'educado-authz',secretAccessKey:'educado-authz-storage-secret'}}); (async()=>{const r=await c.send(new ListBucketsCommand({})); if(!r.Buckets?.some(b=>b.Name==='educado-media')) await c.send(new CreateBucketCommand({Bucket:'educado-media'})); console.log('Bucket educado-media pronto')})().catch(e=>{console.error(e);process.exit(1)})"

    $apiReady = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            Invoke-RestMethod -Uri "$baseUrl/docs/" -TimeoutSec 2 | Out-Null
            $apiReady = $true
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    if (-not $apiReady) {
        Write-Host "Iniciando API em modo de desenvolvimento..."
        Start-Process -FilePath "npx.cmd" -ArgumentList "ts-node", "src/index.ts" -WorkingDirectory $ApiDir -WindowStyle Hidden | Out-Null
        for ($i = 0; $i -lt 60; $i++) {
            try {
                Invoke-RestMethod -Uri "$baseUrl/docs/" -TimeoutSec 2 | Out-Null
                $apiReady = $true
                break
            } catch {
                Start-Sleep -Seconds 1
            }
        }
    }
    if (-not $apiReady) {
        throw "A API nao ficou pronta em $baseUrl"
    }
} finally {
    Pop-Location
}

$adminEmail = $config["ADMIN_EMAIL"]
$adminPassword = $config["ADMIN_PASSWORD"]
$adminExists = $false

try {
    Invoke-Json "POST" "$baseUrl/auth/login" @{ email = $adminEmail; password = $adminPassword } | Out-Null
    $adminExists = $true
} catch {}

if (-not $adminExists) {
    Push-Location $ApiDir
    try {
        npx ts-node src/scripts/seed-admin.ts $adminEmail $adminPassword ADM1 Autorizacao
        if ($LASTEXITCODE -ne 0) { throw "Falha ao criar ADM1" }
    } finally {
        Pop-Location
    }
}

$adminLogin = Invoke-Json "POST" "$baseUrl/auth/login" @{ email = $adminEmail; password = $adminPassword }
$adminToken = $adminLogin.accessToken

function Ensure-User {
    param([string]$Email, [string]$Password)

    $login = $null
    try {
        $login = Invoke-Json "POST" "$baseUrl/auth/login" @{ email = $Email; password = $Password }
    } catch {}
    if ($login) { return @{ id = $login.user.id; token = $login.accessToken } }

    $registered = Invoke-Json "POST" "$baseUrl/auth/registrations" @{
        firstName = "Fixture"
        lastName = "Autorizacao"
        email = $Email
        password = $Password
        confirmPassword = $Password
    }
    Invoke-Json "PUT" "$baseUrl/auth/registrations/$($registered.userId)/profile" @{
        motivations = "Motivacao sintética para o ambiente isolado de testes de autorizacao."
        academicBackground = "Formacao sintetica usada somente para preparar o ambiente de testes."
        professionalExperience = "Experiencia profissional sintetica usada somente para preparar o ambiente de testes."
    } | Out-Null
    Invoke-Json "POST" "$baseUrl/admin/registrations/$($registered.userId)/approve" $null $adminToken | Out-Null

    $login = Invoke-Json "POST" "$baseUrl/auth/login" @{ email = $Email; password = $Password }
    return @{ id = $login.user.id; token = $login.accessToken }
}

$u1 = Ensure-User $config["USER1_EMAIL"] $config["USER1_PASSWORD"]
$u2 = Ensure-User $config["USER2_EMAIL"] $config["USER2_PASSWORD"]

function Ensure-Student {
    param([string]$Phone)
    $result = Invoke-Json "POST" "$baseUrl/student/auth/phone-login" @{ phone = $Phone }
    return @{ id = $result.user.id; token = $result.accessToken }
}

try {
    $a = Ensure-Student $config["STUDENT1_PHONE"]
} catch {
    $aResult = Invoke-Json "POST" "$baseUrl/student/auth/register" @{
        firstName = "Estudante"
        lastName = "AlunoA"
        phone = $config["STUDENT1_PHONE"]
        dateOfBirth = "1990-01-01"
        deviceId = "fixture-a-authz"
    }
    $a = @{ id = $aResult.user.id; token = $aResult.accessToken }
}
try {
    $b = Ensure-Student $config["STUDENT2_PHONE"]
} catch {
    $bResult = Invoke-Json "POST" "$baseUrl/student/auth/register" @{
        firstName = "Estudante"
        lastName = "AlunoB"
        phone = $config["STUDENT2_PHONE"]
        dateOfBirth = "1990-02-02"
        deviceId = "fixture-b-authz"
    }
    $b = @{ id = $bResult.user.id; token = $bResult.accessToken }
}

$coursePayload = {
    param($Title)
    @{
        title = $Title
        description = "Descricao sintetica com mais de vinte caracteres para fixture de autorizacao."
        shortDescription = "Resumo sintético de fixture."
        imageMediaId = "00000000-0000-4000-8000-000000000001"
        difficulty = "beginner"
        estimatedTime = "30 min"
        passingThreshold = 75
        category = "Teste"
        tags = @("isolado")
    }
}

$c1 = Invoke-Json "POST" "$baseUrl/courses" (& $coursePayload "Curso C1 Autorizacao") $u1.token
$c2 = Invoke-Json "POST" "$baseUrl/courses" (& $coursePayload "Curso C2 Autorizacao") $u2.token

$s1Id = [guid]::NewGuid().Guid
$s2Id = [guid]::NewGuid().Guid
$s1 = Invoke-Json "POST" "$baseUrl/sections" @{
    id = $s1Id
    courseId = $c1.id
    title = "Secao S1"
    order = 0
} $u1.token
$s2 = Invoke-Json "POST" "$baseUrl/sections" @{
    id = $s2Id
    courseId = $c2.id
    title = "Secao S2"
    order = 0
} $u2.token

$q1Id = [guid]::NewGuid().Guid
$q2Id = [guid]::NewGuid().Guid
$q1 = Invoke-Json "POST" "$baseUrl/activities" @{
    id = $q1Id
    sectionId = $s1.id
    type = "true_false"
    order = 0
    question = "Questao sintetica Q1?"
    correctAnswer = $true
} $u1.token
$q2 = Invoke-Json "POST" "$baseUrl/activities" @{
    id = $q2Id
    sectionId = $s2.id
    type = "true_false"
    order = 0
    question = "Questao sintetica Q2?"
    correctAnswer = $false
} $u2.token

try {
    Invoke-Json "POST" "$baseUrl/student/enrollments" @{ courseId = $c1.id } $a.token | Out-Null
} catch {
    $existing = Invoke-RestMethod -Uri "$baseUrl/student/enrollments" -Headers @{ Authorization = "Bearer $($a.token)" }
    if ($existing.enrollments.courseId -notcontains $c1.id) { throw $_ }
}
try {
    Invoke-Json "POST" "$baseUrl/student/enrollments" @{ courseId = $c2.id } $b.token | Out-Null
} catch {
    $existing = Invoke-RestMethod -Uri "$baseUrl/student/enrollments" -Headers @{ Authorization = "Bearer $($b.token)" }
    if ($existing.enrollments.courseId -notcontains $c2.id) { throw $_ }
}

Invoke-Json "POST" "$baseUrl/student/progress/courses/$($c1.id)/sections/$($s1.id)" @{
    score = 1
    totalQuestions = 1
} $a.token | Out-Null
Invoke-Json "PUT" "$baseUrl/student/progress/courses/$($c1.id)/complete" $null $a.token | Out-Null

Invoke-Json "POST" "$baseUrl/student/progress/courses/$($c2.id)/sections/$($s2.id)" @{
    score = 1
    totalQuestions = 1
} $b.token | Out-Null
Invoke-Json "PUT" "$baseUrl/student/progress/courses/$($c2.id)/complete" $null $b.token | Out-Null

$progressA = Invoke-RestMethod -Uri "$baseUrl/student/progress/courses/$($c1.id)" -Headers @{ Authorization = "Bearer $($a.token)" }
$progressB = Invoke-RestMethod -Uri "$baseUrl/student/progress/courses/$($c2.id)" -Headers @{ Authorization = "Bearer $($b.token)" }
$certificatesA = Invoke-RestMethod -Uri "$baseUrl/student/certificates" -Headers @{ Authorization = "Bearer $($a.token)" }
$certificatesB = Invoke-RestMethod -Uri "$baseUrl/student/certificates" -Headers @{ Authorization = "Bearer $($b.token)" }

if ($progressA.progressPercent -ne 100 -or $progressB.progressPercent -ne 100) {
    throw "Falha operacional: progresso independente nao atingiu 100%"
}
if (@($certificatesA.certificates).Count -lt 1 -or @($certificatesB.certificates).Count -lt 1) {
    throw "Falha operacional: certificados independentes nao foram emitidos"
}

$certAId = $certificatesA.certificates[0].id
$certBId = $certificatesB.certificates[0].id
$certAUrl = "$baseUrl/student/certificates/$certAId/pdf"
$certBUrl = "$baseUrl/student/certificates/$certBId/pdf"
$certATemp = Join-Path $env:TEMP "educado-cert-a.pdf"
$certBTemp = Join-Path $env:TEMP "educado-cert-b.pdf"
& curl.exe -sS -o $certATemp -H "Authorization: Bearer $($a.token)" $certAUrl
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $certATemp) -or (Get-Item $certATemp).Length -lt 100) {
    throw "Falha operacional ao gerar PDF do certificado A"
}
& curl.exe -sS -o $certBTemp -H "Authorization: Bearer $($b.token)" $certBUrl
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $certBTemp) -or (Get-Item $certBTemp).Length -lt 100) {
    throw "Falha operacional ao gerar PDF do certificado B"
}
Remove-Item $certATemp, $certBTemp -Force

$imageBytes = [byte[]](1, 2, 3, 4)
$imageTemp = Join-Path $env:TEMP "educado-authz-image-$([guid]::NewGuid()).png"
[IO.File]::WriteAllBytes($imageTemp, $imageBytes)

$activeImageU1Json = & curl.exe -sS -H "Authorization: Bearer $($u1.token)" -F "file=@$imageTemp;type=image/png" "$baseUrl/media/images"
if ($LASTEXITCODE -ne 0) { throw "Falha operacional ao enviar Img1" }
$activeImageU1 = $activeImageU1Json | ConvertFrom-Json

$activeImageU2Json = & curl.exe -sS -H "Authorization: Bearer $($u2.token)" -F "file=@$imageTemp;type=image/png" "$baseUrl/media/images"
if ($LASTEXITCODE -ne 0) { throw "Falha operacional ao enviar Img2" }
$activeImageU2 = $activeImageU2Json | ConvertFrom-Json

$inactiveImageU1Json = & curl.exe -sS -H "Authorization: Bearer $($u1.token)" -F "file=@$imageTemp;type=image/png" "$baseUrl/media/images"
if ($LASTEXITCODE -ne 0) { throw "Falha operacional ao enviar midia INACTIVE" }
$inactiveImageU1 = $inactiveImageU1Json | ConvertFrom-Json

Remove-Item $imageTemp -Force

Push-Location $ApiDir
try {
    npx ts-node -e "import { MediaAsset } from './src/models'; MediaAsset.update({ status: 'INACTIVE' }, { where: { id: '$($inactiveImageU1.id)' } }).then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); })"
    if ($LASTEXITCODE -ne 0) { throw "Falha operacional ao preparar midia INACTIVE" }
} finally {
    Pop-Location
}

$courseC1WithMedia = Invoke-Json "PUT" "$baseUrl/courses/$($c1.id)" @{
    title = "Curso C1 Autorizacao"
    description = "Descricao sintetica com mais de vinte caracteres para fixture de autorizacao."
    shortDescription = "Resumo sintético de fixture."
    imageMediaId = $activeImageU1.id
    difficulty = "beginner"
    estimatedTime = "30 min"
    passingThreshold = 75
    category = "Teste"
    tags = @("isolado")
} $u1.token

$manifest = @{
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
    baseUrl = $baseUrl
    versions = @{
        educadoApiCommit = (git -C $ApiDir rev-parse HEAD).Trim()
        educadoTestsCommit = (git -C (Resolve-Path (Join-Path $ambientDir "../../..")).Path rev-parse HEAD).Trim()
        operatingSystem = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription
        node = (node --version).Trim()
        npm = (npm --version).Trim()
        docker = (docker version --format '{{.Server.Version}}').Trim()
        dockerCompose = (docker compose version --short).Trim()
        powershell = $PSVersionTable.PSVersion.ToString()
        tools = @{
            http = "PowerShell Invoke-RestMethod"
            playwright = "not-installed"
            zap = "not-installed"
            jest = "installed in educado-api via npm ci"
            vitest = "defined in educado-web; not executed in this setup"
        }
    }
    actors = @{
        ADM1 = @{ id = $adminLogin.user.id }
        U1 = @{ id = $u1.id }
        U2 = @{ id = $u2.id }
        A = @{ id = $a.id }
        B = @{ id = $b.id }
    }
    resources = @{
        C1 = $c1.id
        C2 = $c2.id
        S1 = $s1.id
        S2 = $s2.id
        Q1 = $q1.id
        Q2 = $q2.id
        Img1 = $activeImageU1.id
        Img2 = $activeImageU2.id
        ImgInactive1 = $inactiveImageU1.id
        MP = $activeImageU1.id
        MNP = $activeImageU2.id
        MI = $inactiveImageU1.id
    }
}
$manifestPath = Join-Path $ambientDir "fixtures.local.json"
$manifest | ConvertTo-Json -Depth 6 | Set-Content $manifestPath -Encoding UTF8

$webDir = Join-Path (Split-Path -Parent $ApiDir) "educado-web"
$webCommit = $null
if (Test-Path $webDir) {
    $webCommit = (git -C $webDir rev-parse HEAD).Trim()
}
$manifest.versions.educadoWebCommit = if ($webCommit) { $webCommit } else { "not-used" }
$manifest | ConvertTo-Json -Depth 6 | Set-Content $manifestPath -Encoding UTF8

$evidence = @{
    executedAt = $manifest.createdAt
    environment = "local"
    apiBaseUrl = $baseUrl
    versions = $manifest.versions
    setup = @{
        status = "approved"
        fixtureManifest = "fixtures.local.json"
        command = "setup.ps1"
        verification = "verify.ps1"
    }
    execution = @{
        state = "not-executed"
        caseId = $null
        subcaseId = $null
        request = $null
        response = $null
        effectBefore = $null
        effectAfter = $null
        evidenceFiles = @()
    }
    limitations = @(
        "P06-P11 remain policy-pending",
        "No authorization HTTP test has been executed"
    )
    operationalBlocker = $null
}
$evidencePath = Join-Path $ambientDir "evidence.local.json"
$evidence | ConvertTo-Json -Depth 8 | Set-Content $evidencePath -Encoding UTF8

Write-Host "Ambiente preparado."
Write-Host "Manifesto: $manifestPath"
