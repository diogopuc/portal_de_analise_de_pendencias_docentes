# iniciar_projeto.ps1
# $PSScriptRoot = caminho real do script (Unicode nativo, sem problemas de encoding)

$base       = $PSScriptRoot
$backendDir = Join-Path $base "backend"
$frontendDir= Join-Path $base "frontend"
$dataDir    = Join-Path $base "data"
$nodeDir    = "$env:USERPROFILE\node-portable\node-v20.19.2-win-x64"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor DarkRed
Write-Host "  PORTAL DE ANALISE DE PENDENCIAS DOCENTES - PUCPR"  -ForegroundColor White
Write-Host "  Grupo Marista - GPCA"                               -ForegroundColor Gray
Write-Host "=====================================================" -ForegroundColor DarkRed
Write-Host ""

# ── [1] NODE.JS ──────────────────────────────────────────────
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Cyan

# Adiciona portable ao PATH da sessao se necessario
if ((Test-Path "$nodeDir\node.exe") -and ($env:PATH -notlike "*$nodeDir*")) {
    $env:PATH = "$nodeDir;$env:PATH"
}

$nodeOk = $false
try {
    $ver = & node --version 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Host "  [OK] Node.js $ver" -ForegroundColor Green; $nodeOk = $true }
} catch {}

if (-not $nodeOk) {
    # Tenta baixar automaticamente
    $zip  = "$env:TEMP\node20.zip"
    $dest = "$env:USERPROFILE\node-portable"
    $url  = "https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip"
    Write-Host "  [INFO] Baixando Node.js v20.19.2..." -ForegroundColor Yellow
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $url -OutFile $zip -ErrorAction Stop
        Expand-Archive -Path $zip -DestinationPath $dest -Force -ErrorAction Stop
        Remove-Item $zip -Force -ErrorAction SilentlyContinue
        $env:PATH = "$nodeDir;$env:PATH"
        $ver = & node --version 2>&1
        Write-Host "  [OK] Node.js instalado: $ver" -ForegroundColor Green
    } catch {
        Write-Host "  [ERRO] Falha ao instalar Node.js: $_" -ForegroundColor Red
        Write-Host "  Instale manualmente em: https://nodejs.org/pt/download" -ForegroundColor Red
        Read-Host "`nPressione Enter para fechar"
        exit 1
    }
}

# ── [2] PASTAS ───────────────────────────────────────────────
Write-Host "[2/5] Preparando pastas..." -ForegroundColor Cyan
@("$dataDir\logs","$dataDir\relatorios","$dataDir\cache","$base\temp") | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}
$xlsxOrig = Join-Path $base "Atv_Pendentes_Abril.xlsx"
$xlsxDest = Join-Path $dataDir "Atv_Pendentes_Abril.xlsx"
if ((Test-Path $xlsxOrig) -and (-not (Test-Path $xlsxDest))) {
    Copy-Item $xlsxOrig $xlsxDest
}
Write-Host "  [OK]" -ForegroundColor Green

# ── [3] DEPENDENCIAS ─────────────────────────────────────────
Write-Host "[3/5] Verificando dependencias..." -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
    Write-Host "  [INFO] Instalando backend (aguarde)..." -ForegroundColor Yellow
    Push-Location $backendDir
    & npm install
    $e = $LASTEXITCODE
    Pop-Location
    if ($e -ne 0) { Write-Host "  [ERRO] Falha no backend." -ForegroundColor Red; Read-Host "Enter para fechar"; exit 1 }
}
Write-Host "  [OK] Backend OK" -ForegroundColor Green

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "  [INFO] Instalando frontend (aguarde)..." -ForegroundColor Yellow
    Push-Location $frontendDir
    & npm install
    $e = $LASTEXITCODE
    Pop-Location
    if ($e -ne 0) { Write-Host "  [ERRO] Falha no frontend." -ForegroundColor Red; Read-Host "Enter para fechar"; exit 1 }
}
Write-Host "  [OK] Frontend OK" -ForegroundColor Green

# .env
$envFile = Join-Path $backendDir ".env"
if (-not (Test-Path $envFile)) {
    @"
PORT=3001
NODE_ENV=development
DATA_DIR=../data
ASSETS_DIR=../assets
TEMP_DIR=../temp
"@ | Set-Content $envFile
}

# ── [4] LIBERAR PORTAS ───────────────────────────────────────
Write-Host "[4/5] Liberando portas 3000 e 3001..." -ForegroundColor Cyan
foreach ($port in @(3000, 3001)) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $conns.OwningProcess | Select-Object -Unique | ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  [OK] Porta $port liberada." -ForegroundColor Green
    }
}
Start-Sleep -Seconds 1

# ── [5] INICIAR SERVICOS ─────────────────────────────────────
Write-Host "[5/5] Iniciando servicos..." -ForegroundColor Cyan

# Start-Process usa o caminho Unicode diretamente — sem problemas de encoding
Start-Process -FilePath "cmd.exe" `
    -ArgumentList @("/k", "cd /d `"$backendDir`" && npm run dev & echo. & echo [Backend encerrado] & pause") `
    -WindowStyle Normal

Write-Host "  [INFO] Aguardando backend (8s)..."
Start-Sleep -Seconds 8

Start-Process -FilePath "cmd.exe" `
    -ArgumentList @("/k", "cd /d `"$frontendDir`" && npm run dev & echo. & echo [Frontend encerrado] & pause") `
    -WindowStyle Normal

Write-Host "  [INFO] Aguardando frontend (10s)..."
Start-Sleep -Seconds 10

Write-Host "  [OK] Sistema iniciado!" -ForegroundColor Green
Start-Process "http://localhost:3000"

# ── MENU ─────────────────────────────────────────────────────
while ($true) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor DarkRed
    Write-Host "  SISTEMA RODANDO" -ForegroundColor Green
    Write-Host "  Frontend : http://localhost:3000"
    Write-Host "  Backend  : http://localhost:3001/api/health"
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
            Write-Host "[INFO] Fechando. As janelas Backend e Frontend continuam rodando." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            exit 0
        }
        "3" {
            Write-Host "[INFO] Encerrando tudo..." -ForegroundColor Yellow
            foreach ($port in @(3000, 3001)) {
                Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
                    Select-Object -ExpandProperty OwningProcess -Unique |
                    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
            }
            Write-Host "[OK] Tudo encerrado." -ForegroundColor Green
            Start-Sleep -Seconds 2
            exit 0
        }
    }
}
