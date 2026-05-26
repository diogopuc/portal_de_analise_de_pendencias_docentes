# iniciar_projeto.ps1 — Uma janela, backend e frontend em background

$base        = $PSScriptRoot
$backendDir  = Join-Path $base "backend"
$frontendDir = Join-Path $base "frontend"
$dataDir     = Join-Path $base "data"
$logDir      = Join-Path $dataDir "logs"
$nodeDir     = "$env:USERPROFILE\node-portable\node-v20.19.2-win-x64"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor DarkRed
Write-Host "  PORTAL DE ANALISE DE PENDENCIAS DOCENTES - PUCPR"  -ForegroundColor White
Write-Host "  Grupo Marista - GPCA"                               -ForegroundColor Gray
Write-Host "=====================================================" -ForegroundColor DarkRed
Write-Host ""

# ── [1] NODE.JS ──────────────────────────────────────────────
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Cyan
if ((Test-Path "$nodeDir\node.exe") -and ($env:PATH -notlike "*$nodeDir*")) {
    $env:PATH = "$nodeDir;$env:PATH"
}
try {
    $ver = & node --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "  [OK] Node.js $ver" -ForegroundColor Green
} catch {
    $zip = "$env:TEMP\node20.zip"; $dest = "$env:USERPROFILE\node-portable"
    Write-Host "  [INFO] Baixando Node.js..." -ForegroundColor Yellow
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip" -OutFile $zip -ErrorAction Stop
        Expand-Archive -Path $zip -DestinationPath $dest -Force -ErrorAction Stop
        Remove-Item $zip -Force -ErrorAction SilentlyContinue
        $env:PATH = "$nodeDir;$env:PATH"
        Write-Host "  [OK] Node.js instalado." -ForegroundColor Green
    } catch {
        Write-Host "  [ERRO] Instale Node.js em: https://nodejs.org" -ForegroundColor Red
        Read-Host "`nEnter para fechar"; exit 1
    }
}

# ── [2] PASTAS ───────────────────────────────────────────────
Write-Host "[2/5] Preparando pastas..." -ForegroundColor Cyan
@($logDir, (Join-Path $dataDir "relatorios"), (Join-Path $dataDir "cache"), (Join-Path $base "temp")) |
    ForEach-Object { if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null } }
$orig = Join-Path $base "Atv_Pendentes_Abril.xlsx"
$dest = Join-Path $dataDir "Atv_Pendentes_Abril.xlsx"
if ((Test-Path $orig) -and (-not (Test-Path $dest))) { Copy-Item $orig $dest }
Write-Host "  [OK]" -ForegroundColor Green

# ── [3] DEPENDENCIAS ─────────────────────────────────────────
Write-Host "[3/5] Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
    Write-Host "  [INFO] Instalando backend (aguarde)..." -ForegroundColor Yellow
    Push-Location $backendDir; & npm install; $e = $LASTEXITCODE; Pop-Location
    if ($e -ne 0) { Write-Host "  [ERRO] Falha no backend." -ForegroundColor Red; Read-Host "Enter"; exit 1 }
}
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "  [INFO] Instalando frontend (aguarde)..." -ForegroundColor Yellow
    Push-Location $frontendDir; & npm install; $e = $LASTEXITCODE; Pop-Location
    if ($e -ne 0) { Write-Host "  [ERRO] Falha no frontend." -ForegroundColor Red; Read-Host "Enter"; exit 1 }
}
Write-Host "  [OK] Backend e Frontend OK" -ForegroundColor Green

$envFile = Join-Path $backendDir ".env"
if (-not (Test-Path $envFile)) {
    "PORT=3001`nNODE_ENV=development`nDATA_DIR=../data`nASSETS_DIR=../assets`nTEMP_DIR=../temp" | Set-Content $envFile
}

# ── [4] LIBERAR PORTAS ───────────────────────────────────────
Write-Host "[4/5] Liberando portas..." -ForegroundColor Cyan
foreach ($port in @(3000, 3001)) {
    Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1
Write-Host "  [OK]" -ForegroundColor Green

# ── [5] INICIAR SERVICOS (sem abrir novas janelas) ───────────
Write-Host "[5/5] Iniciando servicos em background..." -ForegroundColor Cyan

$bLog = Join-Path $logDir "backend.log"
$fLog = Join-Path $logDir "frontend.log"

# Backend — NoNewWindow, output no log
$bProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory $backendDir `
    -NoNewWindow `
    -RedirectStandardOutput $bLog `
    -RedirectStandardError  "$bLog.err" `
    -PassThru

Write-Host "  [INFO] Aguardando backend (8s)..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Frontend — NoNewWindow, output no log
$fProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory $frontendDir `
    -NoNewWindow `
    -RedirectStandardOutput $fLog `
    -RedirectStandardError  "$fLog.err" `
    -PassThru

Write-Host "  [INFO] Aguardando frontend (10s)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "  [OK] Sistema iniciado!" -ForegroundColor Green
Write-Host "  Logs: data\logs\backend.log  /  data\logs\frontend.log" -ForegroundColor Gray
Start-Process "http://localhost:3000"

# ── MENU ─────────────────────────────────────────────────────
function Stop-Services {
    foreach ($port in @(3000, 3001)) {
        Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
}

while ($true) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor DarkRed
    Write-Host "  SISTEMA RODANDO" -ForegroundColor Green
    Write-Host "  Frontend : http://localhost:3000"
    Write-Host "  Backend  : http://localhost:3001/api/health"
    Write-Host "  Logs     : data\logs\backend.log"
    Write-Host ""
    Write-Host "  1 - Abrir navegador"
    Write-Host "  2 - Fechar este CMD  (servicos continuam rodando)"
    Write-Host "  3 - Encerrar TUDO e fechar"
    Write-Host "=====================================================" -ForegroundColor DarkRed
    Write-Host ""

    $op = Read-Host "> Escolha"

    switch ($op) {
        "1" { Start-Process "http://localhost:3000" }
        "2" {
            Write-Host "[INFO] Fechando. Frontend e backend continuam em background." -ForegroundColor Yellow
            Start-Sleep -Seconds 2; exit 0
        }
        "3" {
            Write-Host "[INFO] Encerrando tudo..." -ForegroundColor Yellow
            Stop-Services
            Write-Host "[OK] Tudo encerrado." -ForegroundColor Green
            Start-Sleep -Seconds 2; exit 0
        }
    }
}
