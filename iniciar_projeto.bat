@echo off
setlocal enabledelayedexpansion

title Portal de Pendencias Docentes - PUCPR

echo.
echo =====================================================
echo   PORTAL DE ANALISE DE PENDENCIAS DOCENTES - PUCPR
echo   Grupo Marista - GPCA
echo =====================================================
echo.

set "BASE=%~dp0"
if "!BASE:~-1!"=="\" set "BASE=!BASE:~0,-1!"

echo [INFO] Pasta do projeto: !BASE!
echo.

:: ====== DETECTAR NODE.JS ======
echo [INFO] Verificando Node.js...

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js encontrado no PATH.
    goto :node_ok
)

if exist "%USERPROFILE%\node-portable\node-v20.19.2-win-x64\node.exe" (
    set "PATH=%USERPROFILE%\node-portable\node-v20.19.2-win-x64;!PATH!"
    echo [OK] Node.js portable configurado.
    goto :node_ok
)

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;!PATH!"
    echo [OK] Node.js encontrado em Program Files.
    goto :node_ok
)

if exist "%APPDATA%\nvm\current\node.exe" (
    set "PATH=%APPDATA%\nvm\current;!PATH!"
    echo [OK] Node.js encontrado via nvm.
    goto :node_ok
)

echo [ERRO] Node.js nao encontrado.
echo.
echo Para instalar acesse: https://nodejs.org/pt/download
echo.
pause
exit /b 1

:node_ok
node --version
npm --version
echo.

:: ====== ESTRUTURA DE PASTAS ======
if not exist "!BASE!\data\logs"       mkdir "!BASE!\data\logs"
if not exist "!BASE!\data\relatorios" mkdir "!BASE!\data\relatorios"
if not exist "!BASE!\data\cache"      mkdir "!BASE!\data\cache"
if not exist "!BASE!\temp"            mkdir "!BASE!\temp"
echo [OK] Estrutura de pastas OK.

:: ====== COPIAR EXCEL ======
if exist "!BASE!\Atv_Pendentes_Abril.xlsx" (
    if not exist "!BASE!\data\Atv_Pendentes_Abril.xlsx" (
        copy "!BASE!\Atv_Pendentes_Abril.xlsx" "!BASE!\data\" >nul
        echo [OK] Planilha copiada para data\
    )
)

:: ====== DEPENDENCIAS BACKEND ======
echo.
echo [INFO] Verificando dependencias do backend...
if not exist "!BASE!\backend\node_modules" (
    echo [INFO] Instalando... aguarde.
    cd /d "!BASE!\backend"
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do backend.
        pause
        exit /b 1
    )
    echo [OK] Dependencias do backend instaladas.
) else (
    echo [OK] Backend: dependencias ja instaladas.
)

:: ====== DEPENDENCIAS FRONTEND ======
echo.
echo [INFO] Verificando dependencias do frontend...
if not exist "!BASE!\frontend\node_modules" (
    echo [INFO] Instalando... aguarde.
    cd /d "!BASE!\frontend"
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias do frontend.
        pause
        exit /b 1
    )
    echo [OK] Dependencias do frontend instaladas.
) else (
    echo [OK] Frontend: dependencias ja instaladas.
)

:: ====== ARQUIVO .ENV ======
if not exist "!BASE!\backend\.env" (
    (
        echo PORT=3001
        echo NODE_ENV=development
        echo DATA_DIR=../data
        echo ASSETS_DIR=../assets
        echo TEMP_DIR=../temp
    ) > "!BASE!\backend\.env"
    echo [OK] Arquivo .env criado.
)

:: ====== INICIAR BACKEND ======
echo.
echo [INFO] Iniciando backend na porta 3001...
start "Backend PUCPR :3001" /d "!BASE!\backend" cmd /k "npm run dev"

echo [INFO] Aguardando backend inicializar (7s)...
timeout /t 7 /nobreak >nul

:: ====== INICIAR FRONTEND ======
echo [INFO] Iniciando frontend na porta 3000...
start "Frontend PUCPR :3000" /d "!BASE!\frontend" cmd /k "npm run dev"

echo [INFO] Aguardando frontend inicializar (8s)...
timeout /t 8 /nobreak >nul

:: ====== ABRIR NAVEGADOR ======
echo [INFO] Abrindo navegador...
start "" "http://localhost:3000"

:: ====== MENU DE CONTROLE ======
:menu
echo.
echo =====================================================
echo   [OK] SISTEMA RODANDO
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:3001/api/health
echo.
echo   1 - Abrir navegador
echo   2 - Encerrar tudo e fechar
echo =====================================================
echo.
set /p "op=> Escolha (1 ou 2): "

if "!op!"=="1" (
    start "" "http://localhost:3000"
    goto :menu
)
if "!op!"=="2" goto :shutdown
goto :menu

:: ====== ENCERRAR TUDO ======
:shutdown
echo.
echo [INFO] Encerrando servicos...

taskkill /FI "WINDOWTITLE eq Backend PUCPR :3001" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend PUCPR :3000" /F >nul 2>&1

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /F /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000 " 2^>nul') do (
    taskkill /F /PID %%p >nul 2>&1
)

echo [OK] Servicos encerrados.
echo.
timeout /t 2 /nobreak >nul
endlocal
