@echo off
chcp 1252 >nul
title Portal de Pendencias Docentes - PUCPR

set "nodeDir=%USERPROFILE%\node-portable\node-v20.19.2-win-x64"
set "base=%~dp0"
if "%base:~-1%"=="\" set "base=%base:~0,-1%"
set "backendDir=%base%\backend"
set "frontendDir=%base%\frontend"
set "dataDir=%base%\data"
set "logDir=%dataDir%\logs"

echo.
echo =====================================================
echo   PORTAL DE ANALISE DE PENDENCIAS DOCENTES - PUCPR
echo   Grupo Marista - GPCA
echo =====================================================
echo.

:: [1] NODE.JS
echo [1/5] Verificando Node.js...
if exist "%nodeDir%\node.exe" set "PATH=%nodeDir%;%PATH%"
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ERRO] Node.js nao encontrado.
    echo   Instale em: https://nodejs.org ou contate o administrador.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>nul') do echo   [OK] Node.js %%v

:: [2] PASTAS
echo [2/5] Preparando pastas...
if not exist "%logDir%"                          mkdir "%logDir%"
if not exist "%dataDir%\relatorios"              mkdir "%dataDir%\relatorios"
if not exist "%dataDir%\cache"                   mkdir "%dataDir%\cache"
if not exist "%base%\temp"                       mkdir "%base%\temp"
if exist "%base%\Atv_Pendentes_Abril.xlsx" (
    if not exist "%dataDir%\Atv_Pendentes_Abril.xlsx" (
        copy /y "%base%\Atv_Pendentes_Abril.xlsx" "%dataDir%\" >nul
    )
)
echo   [OK]

:: [3] DEPENDENCIAS
echo [3/5] Verificando dependencias...
if not exist "%backendDir%\node_modules" (
    echo   [INFO] Instalando backend ^(aguarde^)...
    pushd "%backendDir%"
    call npm install
    if %errorlevel% neq 0 ( popd & echo   [ERRO] Falha no backend. & pause & exit /b 1 )
    popd
)
if not exist "%frontendDir%\node_modules" (
    echo   [INFO] Instalando frontend ^(aguarde^)...
    pushd "%frontendDir%"
    call npm install
    if %errorlevel% neq 0 ( popd & echo   [ERRO] Falha no frontend. & pause & exit /b 1 )
    popd
)
echo   [OK]

:: [4] LIBERAR PORTAS
echo [4/5] Liberando portas 3000 e 3001...
for %%p in (3000 3001) do (
    for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":%%p "') do (
        taskkill /F /PID %%i >nul 2>&1
    )
)
timeout /t 1 /nobreak >nul
echo   [OK]

:: [5] INICIAR SERVICOS
echo [5/5] Iniciando servicos ^(janelas minimizadas^)...

start "Backend PUCPR" /min cmd /k "set PATH=%nodeDir%;%PATH% && cd /d "%backendDir%" && npm run dev"

echo   [INFO] Aguardando backend na porta 3001...
:wait_backend
timeout /t 1 /nobreak >nul
netstat -an 2>nul | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 goto wait_backend
echo   [OK] Backend ativo em :3001

start "Frontend PUCPR" /min cmd /k "set PATH=%nodeDir%;%PATH% && cd /d "%frontendDir%" && npm run dev"

echo   [INFO] Aguardando frontend na porta 3000...
:wait_frontend
timeout /t 1 /nobreak >nul
netstat -an 2>nul | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 goto wait_frontend
echo   [OK] Frontend ativo em :3000

echo.
echo   Abrindo navegador...
start http://localhost:3000

echo.
echo =====================================================
echo   SISTEMA RODANDO
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:3001/api/health
echo.
echo   Backend e Frontend rodam minimizados na barra.
echo.
echo   [1] Abrir navegador
echo   [2] Encerrar tudo e fechar
echo =====================================================
echo.

:menu
set /p "op=> Escolha: "
if "%op%"=="1" ( start http://localhost:3000 & goto menu )
if "%op%"=="2" goto encerrar
goto menu

:encerrar
echo Encerrando servicos...
for %%p in (3000 3001) do (
    for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":%%p "') do (
        taskkill /F /PID %%i >nul 2>&1
    )
)
echo [OK] Tudo encerrado.
timeout /t 2 /nobreak >nul