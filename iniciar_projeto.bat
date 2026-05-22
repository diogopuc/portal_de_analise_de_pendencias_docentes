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

:: ====== DETECTAR NODE.JS ======
echo [INFO] Verificando Node.js...

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js encontrado.
    goto :node_ok
)

if exist "%USERPROFILE%\node-portable\node-v20.19.2-win-x64\node.exe" (
    set "PATH=%USERPROFILE%\node-portable\node-v20.19.2-win-x64;%PATH%"
    echo [OK] Node.js portable encontrado.
    goto :node_ok
)

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    echo [OK] Node.js em Program Files.
    goto :node_ok
)

if exist "%APPDATA%\nvm\current\node.exe" (
    set "PATH=%APPDATA%\nvm\current;%PATH%"
    echo [OK] Node.js via nvm.
    goto :node_ok
)

:: ====== BAIXAR NODE.JS ======
echo.
echo [INFO] Node.js nao encontrado. Baixando automaticamente...
echo [INFO] Aguarde alguns minutos.
echo.

set "NODE_ZIP=%TEMP%\node-v20.19.2-win-x64.zip"
set "NODE_DEST=%USERPROFILE%\node-portable"
set "NODE_URL=https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip"

if exist "!NODE_ZIP!" del "!NODE_ZIP!" >nul 2>&1

echo [INFO] Baixando Node.js v20.19.2...
curl.exe -L -o "!NODE_ZIP!" "!NODE_URL!"

if not exist "!NODE_ZIP!" (
    echo [INFO] Tentando via PowerShell...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_ZIP!'"
)

if not exist "!NODE_ZIP!" (
    echo.
    echo [ERRO] Nao foi possivel baixar o Node.js.
    echo        Instale manualmente: https://nodejs.org/pt/download
    echo.
    pause
    exit /b 1
)

echo [INFO] Extraindo Node.js...
if not exist "!NODE_DEST!" mkdir "!NODE_DEST!"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Expand-Archive -Path '!NODE_ZIP!' -DestinationPath '!NODE_DEST!' -Force"
del "!NODE_ZIP!" >nul 2>&1

if not exist "!NODE_DEST!\node-v20.19.2-win-x64\node.exe" (
    echo.
    echo [ERRO] Falha ao extrair Node.js.
    echo        Instale manualmente: https://nodejs.org/pt/download
    echo.
    pause
    exit /b 1
)

set "PATH=!NODE_DEST!\node-v20.19.2-win-x64;!PATH!"
echo [OK] Node.js instalado com sucesso.

:node_ok
echo.
node --version
npm --version
echo.

:: ====== ESTRUTURA DE PASTAS ======
if not exist "%~dp0data\logs"       mkdir "%~dp0data\logs"
if not exist "%~dp0data\relatorios" mkdir "%~dp0data\relatorios"
if not exist "%~dp0data\cache"      mkdir "%~dp0data\cache"
if not exist "%~dp0temp"            mkdir "%~dp0temp"

:: ====== COPIAR EXCEL ======
if exist "%~dp0Atv_Pendentes_Abril.xlsx" (
    if not exist "%~dp0data\Atv_Pendentes_Abril.xlsx" (
        copy "%~dp0Atv_Pendentes_Abril.xlsx" "%~dp0data\" >nul
    )
)

:: ====== DEPENDENCIAS BACKEND ======
echo [INFO] Verificando dependencias do backend...
if not exist "%~dp0backend\node_modules" (
    echo [INFO] Instalando dependencias do backend...
    pushd "%~dp0backend"
    call npm install
    set "ERR=!errorlevel!"
    popd
    if !ERR! NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias do backend.
        pause
        exit /b 1
    )
    echo [OK] Backend instalado.
) else (
    echo [OK] Backend OK.
)

:: ====== DEPENDENCIAS FRONTEND ======
echo [INFO] Verificando dependencias do frontend...
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Instalando dependencias do frontend...
    pushd "%~dp0frontend"
    call npm install
    set "ERR=!errorlevel!"
    popd
    if !ERR! NEQ 0 (
        echo [ERRO] Falha ao instalar dependencias do frontend.
        pause
        exit /b 1
    )
    echo [OK] Frontend instalado.
) else (
    echo [OK] Frontend OK.
)

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
echo.
echo [INFO] Liberando portas 3000 e 3001...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul

:: ====== INICIAR SERVICOS ======
echo [INFO] Iniciando backend...
pushd "%~dp0backend"
start /B npm run dev
popd
timeout /t 10 /nobreak >nul

echo [INFO] Iniciando frontend...
pushd "%~dp0frontend"
start /B npm run dev
popd
timeout /t 10 /nobreak >nul

:: ====== ABRIR NAVEGADOR ======
echo [INFO] Abrindo navegador...
rundll32 url.dll,FileProtocolHandler http://localhost:3000

:: ====== MENU ======
:menu
echo.
echo =====================================================
echo   [OK] PORTAL DE PENDENCIAS RODANDO
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:3001/api/health
echo.
echo   1 - Abrir navegador
echo   2 - Encerrar tudo
echo =====================================================
echo.
set "op="
set /p op=Escolha (1 ou 2):
if "!op!"=="1" (
    rundll32 url.dll,FileProtocolHandler http://localhost:3000
    goto :menu
)
if "!op!"=="2" goto :shutdown
goto :menu

:shutdown
echo.
echo [INFO] Encerrando servicos...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
echo [OK] Encerrado.
timeout /t 2 /nobreak >nul
endlocal
exit /b 0
