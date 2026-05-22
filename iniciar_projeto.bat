@echo off
setlocal enabledelayedexpansion

title Portal de Pendencias Docentes - PUCPR

:: Log de diagnostico - grava cada passo em iniciar_log.txt
set "LOG=%~dp0iniciar_log.txt"
echo Iniciando bat em %date% %time% > "!LOG!"

echo.
echo =====================================================
echo   PORTAL DE ANALISE DE PENDENCIAS DOCENTES - PUCPR
echo   Grupo Marista - GPCA
echo =====================================================
echo.
echo [INFO] Log de diagnostico: iniciar_log.txt
echo.

echo [PASSO 1] Verificando Node.js >> "!LOG!"

:: ====== DETECTAR NODE.JS ======
echo [INFO] Verificando Node.js...

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js no PATH >> "!LOG!"
    goto :node_ok
)

if exist "%USERPROFILE%\node-portable\node-v20.19.2-win-x64\node.exe" (
    set "PATH=%USERPROFILE%\node-portable\node-v20.19.2-win-x64;%PATH%"
    echo [OK] Node.js portable encontrado.
    echo [OK] Node.js portable encontrado >> "!LOG!"
    goto :node_ok
)

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    echo [OK] Node.js em Program Files.
    echo [OK] Node.js em Program Files >> "!LOG!"
    goto :node_ok
)

if exist "%APPDATA%\nvm\current\node.exe" (
    set "PATH=%APPDATA%\nvm\current;%PATH%"
    echo [OK] Node.js via nvm.
    echo [OK] Node.js via nvm >> "!LOG!"
    goto :node_ok
)

:: ====== BAIXAR NODE.JS ======
echo [INFO] Node.js nao encontrado. Baixando...
echo [PASSO 2] Baixando Node.js >> "!LOG!"

set "NODE_ZIP=%TEMP%\node-v20.19.2-win-x64.zip"
set "NODE_DEST=%USERPROFILE%\node-portable"
set "NODE_URL=https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip"

if exist "!NODE_ZIP!" del "!NODE_ZIP!" >nul 2>&1

echo [INFO] Baixando Node.js v20.19.2 (~20MB)...
curl.exe -L -o "!NODE_ZIP!" "!NODE_URL!"
echo curl retornou: !errorlevel! >> "!LOG!"

if not exist "!NODE_ZIP!" (
    echo [INFO] curl falhou. Tentando PowerShell...
    echo [INFO] Tentando PowerShell >> "!LOG!"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_ZIP!'"
    echo PowerShell retornou: !errorlevel! >> "!LOG!"
)

if not exist "!NODE_ZIP!" (
    echo [ERRO] Falha no download. >> "!LOG!"
    echo.
    echo [ERRO] Nao foi possivel baixar o Node.js.
    echo        Instale manualmente: https://nodejs.org/pt/download
    echo.
    pause
    exit /b 1
)

echo [INFO] Extraindo...
echo [PASSO 3] Extraindo Node.js >> "!LOG!"
if not exist "!NODE_DEST!" mkdir "!NODE_DEST!"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Expand-Archive -Path '!NODE_ZIP!' -DestinationPath '!NODE_DEST!' -Force"
echo Extracao retornou: !errorlevel! >> "!LOG!"
del "!NODE_ZIP!" >nul 2>&1

if not exist "!NODE_DEST!\node-v20.19.2-win-x64\node.exe" (
    echo [ERRO] node.exe nao encontrado apos extracao >> "!LOG!"
    echo.
    echo [ERRO] Falha ao extrair o Node.js.
    echo        Instale manualmente: https://nodejs.org/pt/download
    echo.
    pause
    exit /b 1
)

set "PATH=!NODE_DEST!\node-v20.19.2-win-x64;!PATH!"
echo [OK] Node.js instalado com sucesso.
echo [OK] Node.js extraido e PATH configurado >> "!LOG!"

:node_ok
echo [PASSO 4] Node.js OK >> "!LOG!"
node --version >> "!LOG!" 2>&1
npm --version >> "!LOG!" 2>&1
echo.
node --version
npm --version
echo.

:: ====== ESTRUTURA DE PASTAS ======
echo [PASSO 5] Criando pastas >> "!LOG!"
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
echo [PASSO 6] Dependencias backend >> "!LOG!"
echo [INFO] Verificando dependencias do backend...
if not exist "%~dp0backend\node_modules" (
    echo [INFO] Instalando dependencias do backend...
    pushd "%~dp0backend"
    call npm install >> "!LOG!" 2>&1
    set "ERR=!errorlevel!"
    popd
    echo npm install backend retornou: !ERR! >> "!LOG!"
    if "!ERR!" NEQ "0" (
        echo [ERRO] Falha ao instalar backend.
        pause
        exit /b 1
    )
    echo [OK] Backend instalado.
) else (
    echo [OK] Backend: dependencias OK.
    echo [OK] Backend node_modules ja existe >> "!LOG!"
)

:: ====== DEPENDENCIAS FRONTEND ======
echo [PASSO 7] Dependencias frontend >> "!LOG!"
echo [INFO] Verificando dependencias do frontend...
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Instalando dependencias do frontend...
    pushd "%~dp0frontend"
    call npm install >> "!LOG!" 2>&1
    set "ERR=!errorlevel!"
    popd
    echo npm install frontend retornou: !ERR! >> "!LOG!"
    if "!ERR!" NEQ "0" (
        echo [ERRO] Falha ao instalar frontend.
        pause
        exit /b 1
    )
    echo [OK] Frontend instalado.
) else (
    echo [OK] Frontend: dependencias OK.
    echo [OK] Frontend node_modules ja existe >> "!LOG!"
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
echo [PASSO 8] Liberando portas >> "!LOG!"
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul

:: ====== INICIAR SERVICOS ======
echo [PASSO 9] Iniciando servicos >> "!LOG!"
echo [INFO] Iniciando backend e frontend...

pushd "%~dp0backend"
start /B npm run dev >> "!LOG!" 2>&1
popd
timeout /t 10 /nobreak >nul

pushd "%~dp0frontend"
start /B npm run dev >> "!LOG!" 2>&1
popd
timeout /t 10 /nobreak >nul

echo [PASSO 10] Verificando portas >> "!LOG!"
netstat -aon 2>nul | findstr ":3001 " >> "!LOG!"
netstat -aon 2>nul | findstr ":3000 " >> "!LOG!"

:: ====== ABRIR NAVEGADOR ======
echo [PASSO 11] Abrindo navegador >> "!LOG!"
rundll32 url.dll,FileProtocolHandler http://localhost:3000

:: ====== MENU ======
:menu
echo.
echo =====================================================
echo   [OK] PORTAL DE PENDENCIAS RODANDO
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:3001/api/health
echo   Log      : iniciar_log.txt
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
echo [INFO] Encerrando...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
echo [OK] Encerrado.
echo Encerrado em %date% %time% >> "!LOG!"
timeout /t 2 /nobreak >nul
endlocal
exit /b 0
