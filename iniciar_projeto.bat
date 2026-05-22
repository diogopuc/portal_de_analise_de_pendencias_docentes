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
if not errorlevel 1 goto :node_ok

if exist "%USERPROFILE%\node-portable\node-v20.19.2-win-x64\node.exe" (
    set "PATH=%USERPROFILE%\node-portable\node-v20.19.2-win-x64;%PATH%"
    echo [OK] Node.js portable encontrado.
    goto :node_ok
)

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    echo [OK] Node.js encontrado em Program Files.
    goto :node_ok
)

if exist "%APPDATA%\nvm\current\node.exe" (
    set "PATH=%APPDATA%\nvm\current;%PATH%"
    echo [OK] Node.js encontrado via nvm.
    goto :node_ok
)

:: ====== NODE NAO ENCONTRADO - BAIXAR AUTOMATICAMENTE ======
echo.
echo [INFO] Node.js nao encontrado. Baixando automaticamente...
echo [INFO] Aguarde, isso pode levar alguns minutos.
echo.

set "NODE_ZIP=%TEMP%\node-v20.19.2-win-x64.zip"
set "NODE_DEST=%USERPROFILE%\node-portable"
set "NODE_URL=https://nodejs.org/dist/v20.19.2/node-v20.19.2-win-x64.zip"

:: Remove ZIP anterior se existir
if exist "!NODE_ZIP!" del "!NODE_ZIP!" >nul 2>&1

:: Tentativa 1: curl (Windows 10+)
echo [INFO] Tentativa de download via curl...
curl.exe -L --progress-bar -o "!NODE_ZIP!" "!NODE_URL!"

:: Tentativa 2: PowerShell com ExecutionPolicy Bypass
if not exist "!NODE_ZIP!" (
    echo [INFO] Tentando via PowerShell...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_ZIP!'"
)

if not exist "!NODE_ZIP!" (
    echo.
    echo [ERRO] Falha no download do Node.js.
    echo        Baixe manualmente em: https://nodejs.org/pt/download
    echo        e instale antes de rodar este script.
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] Extraindo Node.js em !NODE_DEST! ...
if not exist "!NODE_DEST!" mkdir "!NODE_DEST!"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Expand-Archive -Path '!NODE_ZIP!' -DestinationPath '!NODE_DEST!' -Force"
del "!NODE_ZIP!" >nul 2>&1

if not exist "!NODE_DEST!\node-v20.19.2-win-x64\node.exe" (
    echo.
    echo [ERRO] Falha ao extrair o Node.js.
    echo        Tente instalar manualmente em: https://nodejs.org/pt/download
    echo.
    pause
    exit /b 1
)

set "PATH=!NODE_DEST!\node-v20.19.2-win-x64;!PATH!"
echo [OK] Node.js instalado com sucesso.

:node_ok
echo.
echo [INFO] Versao do Node.js:
node --version
echo [INFO] Versao do npm:
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
        echo [OK] Planilha copiada.
    )
)

:: ====== DEPENDENCIAS BACKEND ======
echo [INFO] Verificando dependencias do backend...
if not exist "%~dp0backend\node_modules" (
    echo [INFO] Instalando dependencias do backend (aguarde)...
    pushd "%~dp0backend"
    call npm install
    set "ERR=!errorlevel!"
    popd
    if "!ERR!" NEQ "0" (
        echo.
        echo [ERRO] Falha ao instalar dependencias do backend.
        pause
        exit /b 1
    )
    echo [OK] Dependencias do backend instaladas.
) else (
    echo [OK] Backend: dependencias OK.
)

:: ====== DEPENDENCIAS FRONTEND ======
echo [INFO] Verificando dependencias do frontend...
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Instalando dependencias do frontend (aguarde)...
    pushd "%~dp0frontend"
    call npm install
    set "ERR=!errorlevel!"
    popd
    if "!ERR!" NEQ "0" (
        echo.
        echo [ERRO] Falha ao instalar dependencias do frontend.
        pause
        exit /b 1
    )
    echo [OK] Dependencias do frontend instaladas.
) else (
    echo [OK] Frontend: dependencias OK.
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
    echo [OK] .env criado.
)

:: ====== LIBERAR PORTAS ======
echo.
echo [INFO] Liberando portas 3000 e 3001...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul

:: ====== INICIAR BACKEND ======
echo [INFO] Iniciando backend na porta 3001...
pushd "%~dp0backend"
start /B npm run dev
popd
echo [INFO] Aguardando backend (10s)...
timeout /t 10 /nobreak >nul

:: ====== INICIAR FRONTEND ======
echo [INFO] Iniciando frontend na porta 3000...
pushd "%~dp0frontend"
start /B npm run dev
popd
echo [INFO] Aguardando frontend (10s)...
timeout /t 10 /nobreak >nul

:: ====== VERIFICAR SE SUBIRAM ======
echo.
netstat -aon 2>nul | findstr ":3001 " >nul
if errorlevel 1 (
    echo [AVISO] Backend nao respondeu na porta 3001.
    echo         Verifique os logs acima para identificar o erro.
    echo.
    pause
    goto :menu
)
echo [OK] Backend rodando na porta 3001.

netstat -aon 2>nul | findstr ":3000 " >nul
if errorlevel 1 (
    echo [AVISO] Frontend nao respondeu na porta 3000.
    echo         Verifique os logs acima para identificar o erro.
    echo.
    pause
)
echo [OK] Frontend rodando na porta 3000.

:: ====== ABRIR NAVEGADOR ======
echo [INFO] Abrindo navegador...
rundll32 url.dll,FileProtocolHandler http://localhost:3000

:: ====== MENU DE CONTROLE ======
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

:: ====== ENCERRAR TUDO ======
:shutdown
echo.
echo [INFO] Encerrando servicos...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
echo [OK] Encerrado.
timeout /t 2 /nobreak >nul
endlocal
exit /b 0
