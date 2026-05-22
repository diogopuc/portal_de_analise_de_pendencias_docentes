@echo off
setlocal enabledelayedexpansion
chcp 1252 >nul

title Portal de Pendencias Docentes - PUCPR

echo.
echo =====================================================
echo   PORTAL DE ANALISE DE PENDENCIAS DOCENTES - PUCPR
echo   Grupo Marista - GPCA
echo =====================================================
echo.
echo   IMPORTANTE: Execute este arquivo com DUPLO CLIQUE
echo   no Windows Explorer, nao pelo terminal do VS Code.
echo.

:: ====== DETECTAR NODE.JS ======
echo [1/6] Verificando Node.js...

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js no PATH: & node --version
    goto :node_ok
)

if exist "%USERPROFILE%\node-portable\node-v20.19.2-win-x64\node.exe" (
    set "PATH=%USERPROFILE%\node-portable\node-v20.19.2-win-x64;%PATH%"
    echo [OK] Node.js portable: & node --version
    goto :node_ok
)

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    echo [OK] Node.js Program Files: & node --version
    goto :node_ok
)

if exist "%APPDATA%\nvm\current\node.exe" (
    set "PATH=%APPDATA%\nvm\current;%PATH%"
    echo [OK] Node.js nvm: & node --version
    goto :node_ok
)

:: ====== BAIXAR NODE.JS ======
echo [INFO] Node.js nao encontrado. Baixando...
echo.
set "NODE_ZIP=%TEMP%\node-v20.19.2-win-x64.zip"
set "NODE_DEST=%USERPROFILE%\node-portable"
set "NODE_URL=https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip"
if exist "!NODE_ZIP!" del "!NODE_ZIP!" >nul 2>&1

curl.exe -L -o "!NODE_ZIP!" "!NODE_URL!"
if not exist "!NODE_ZIP!" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_ZIP!'"
)
if not exist "!NODE_ZIP!" (
    echo [ERRO] Download falhou. Instale o Node.js manualmente:
    echo        https://nodejs.org/pt/download
    pause
    exit /b 1
)

echo [INFO] Extraindo...
if not exist "!NODE_DEST!" mkdir "!NODE_DEST!"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Expand-Archive -Path '!NODE_ZIP!' -DestinationPath '!NODE_DEST!' -Force"
del "!NODE_ZIP!" >nul 2>&1

if not exist "!NODE_DEST!\node-v20.19.2-win-x64\node.exe" (
    echo [ERRO] Extracao falhou. Instale o Node.js manualmente:
    echo        https://nodejs.org/pt/download
    pause
    exit /b 1
)
set "PATH=!NODE_DEST!\node-v20.19.2-win-x64;!PATH!"
echo [OK] Node.js instalado: & node --version

:node_ok
echo.

:: ====== PASTAS E EXCEL ======
echo [2/6] Criando estrutura de pastas...
if not exist "%~dp0data\logs"       mkdir "%~dp0data\logs"
if not exist "%~dp0data\relatorios" mkdir "%~dp0data\relatorios"
if not exist "%~dp0data\cache"      mkdir "%~dp0data\cache"
if not exist "%~dp0temp"            mkdir "%~dp0temp"
if exist "%~dp0Atv_Pendentes_Abril.xlsx" (
    if not exist "%~dp0data\Atv_Pendentes_Abril.xlsx" (
        copy "%~dp0Atv_Pendentes_Abril.xlsx" "%~dp0data\" >nul
    )
)
echo [OK] Pastas prontas.
echo.

:: ====== DEPENDENCIAS BACKEND ======
echo [3/6] Dependencias do backend...
if not exist "%~dp0backend\node_modules" (
    echo [INFO] Instalando (pode demorar alguns minutos)...
    pushd "%~dp0backend"
    call npm install
    if errorlevel 1 (
        popd
        echo [ERRO] Falha no npm install do backend.
        pause
        exit /b 1
    )
    popd
)
echo [OK] Backend pronto.
echo.

:: ====== DEPENDENCIAS FRONTEND ======
echo [4/6] Dependencias do frontend...
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Instalando (pode demorar alguns minutos)...
    pushd "%~dp0frontend"
    call npm install
    if errorlevel 1 (
        popd
        echo [ERRO] Falha no npm install do frontend.
        pause
        exit /b 1
    )
    popd
)
echo [OK] Frontend pronto.
echo.

:: ====== ARQUIVO .ENV ======
if not exist "%~dp0backend\.env" (
    (
        echo PORT=3001
        echo NODE_ENV=development
        echo DATA_DIR=../data
        echo ASSETS_DIR=../assets
        echo TEMP_DIR=../temp
    ) > "%~dp0backend\.env"
)

:: ====== LIBERAR PORTAS ======
echo [5/6] Liberando portas...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul
echo [OK] Portas liberadas.
echo.

:: ====== INICIAR SERVICOS ======
:: Passa o PATH explicitamente para garantir que node/npm sejam encontrados
:: dentro das janelas filhas, independente da configuracao do sistema
echo [6/6] Iniciando servicos...
start "Backend - PUCPR :3001" /d "%~dp0backend" cmd /k "set PATH=!PATH! && npm run dev"
echo [INFO] Aguardando backend (8s)...
timeout /t 8 /nobreak >nul

start "Frontend - PUCPR :3000" /d "%~dp0frontend" cmd /k "set PATH=!PATH! && npm run dev"
echo [INFO] Aguardando frontend (10s)...
timeout /t 10 /nobreak >nul

echo [OK] Servicos iniciados!
echo.

:: ====== ABRIR NAVEGADOR ======
rundll32 url.dll,FileProtocolHandler http://localhost:3000

:: ====== MENU ======
:menu
echo.
echo =====================================================
echo   SISTEMA RODANDO
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:3001/api/health
echo   1 - Abrir navegador  ^|  2 - Encerrar
echo =====================================================
set "op="
set /p op=Escolha:
if "!op!"=="1" ( rundll32 url.dll,FileProtocolHandler http://localhost:3000 & goto :menu )
if "!op!"=="2" goto :shutdown
goto :menu

:shutdown
taskkill /FI "WINDOWTITLE eq Backend - PUCPR :3001" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - PUCPR :3000" /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
echo [OK] Encerrado.
timeout /t 2 /nobreak >nul
endlocal
exit /b 0
