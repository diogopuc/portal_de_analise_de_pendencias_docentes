@echo off
title Portal de Pendencias Docentes - PUCPR

echo.
echo =====================================================
echo   PORTAL DE ANALISE DE PENDENCIAS DOCENTES - PUCPR
echo   Grupo Marista - GPCA
echo =====================================================
echo.

:: ====== DETECTAR NODE.JS ======
set NODE_EXE=node
set NPM_EXE=npm

node --version >nul 2>&1
if %errorlevel% == 0 goto :node_ok

:: Tentar node portable do usuario
if exist "%USERPROFILE%\node-portable\node-v20.19.2-win-x64\node.exe" (
    set NODE_EXE=%USERPROFILE%\node-portable\node-v20.19.2-win-x64\node.exe
    set NPM_EXE=%USERPROFILE%\node-portable\node-v20.19.2-win-x64\npm.cmd
    set PATH=%USERPROFILE%\node-portable\node-v20.19.2-win-x64;%PATH%
    goto :node_ok
)

:: Tentar instalacao padrao
if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_EXE=C:\Program Files\nodejs\node.exe
    set NPM_EXE=C:\Program Files\nodejs\npm.cmd
    set PATH=C:\Program Files\nodejs;%PATH%
    goto :node_ok
)

:: Tentar instalacao via AppData (nvm, fnm, etc.)
if exist "%APPDATA%\npm\node.exe" (
    set NODE_EXE=%APPDATA%\npm\node.exe
    set NPM_EXE=%APPDATA%\npm\npm.cmd
    set PATH=%APPDATA%\npm;%PATH%
    goto :node_ok
)

echo.
echo [ERRO] Node.js nao encontrado.
echo.
echo Opcoes:
echo   1) Instale o Node.js em https://nodejs.org
echo   2) Ou execute no terminal: winget install OpenJS.NodeJS.LTS
echo.
pause
exit /b 1

:node_ok
echo [OK] Node.js detectado:
"%NODE_EXE%" --version
echo.

:: ====== DIRETORIO BASE ======
set BASE_DIR=%~dp0
cd /d "%BASE_DIR%"

:: ====== ESTRUTURA DE PASTAS ======
if not exist "data\logs" mkdir "data\logs"
if not exist "data\relatorios" mkdir "data\relatorios"
if not exist "data\cache" mkdir "data\cache"
if not exist "temp" mkdir "temp"
echo [OK] Estrutura de pastas verificada.

:: ====== COPIAR EXCEL SE NECESSARIO ======
if exist "Atv_Pendentes_Abril.xlsx" (
    if not exist "data\Atv_Pendentes_Abril.xlsx" (
        copy "Atv_Pendentes_Abril.xlsx" "data\" >nul
        echo [OK] Planilha copiada para data\
    )
)

:: ====== DEPENDENCIAS BACKEND ======
echo.
echo [INFO] Verificando backend...
cd /d "%BASE_DIR%\backend"
if not exist "node_modules" (
    echo [INFO] Instalando dependencias do backend...
    call "%NPM_EXE%" install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha nas dependencias do backend.
        pause
        exit /b 1
    )
    echo [OK] Backend: dependencias instaladas.
) else (
    echo [OK] Backend: dependencias ja instaladas.
)

:: ====== DEPENDENCIAS FRONTEND ======
echo.
echo [INFO] Verificando frontend...
cd /d "%BASE_DIR%\frontend"
if not exist "node_modules" (
    echo [INFO] Instalando dependencias do frontend...
    call "%NPM_EXE%" install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha nas dependencias do frontend.
        pause
        exit /b 1
    )
    echo [OK] Frontend: dependencias instaladas.
) else (
    echo [OK] Frontend: dependencias ja instaladas.
)

:: ====== ARQUIVO .ENV ======
cd /d "%BASE_DIR%\backend"
if not exist ".env" (
    (
        echo PORT=3001
        echo NODE_ENV=development
        echo DATA_DIR=../data
        echo ASSETS_DIR=../assets
        echo TEMP_DIR=../temp
    ) > .env
    echo [OK] Arquivo .env criado.
)

:: ====== INICIAR BACKEND ======
echo.
echo [INFO] Iniciando backend (porta 3001)...
cd /d "%BASE_DIR%\backend"
start "Backend PUCPR :3001" cmd /k ""%NODE_EXE%" node_modules\.bin\ts-node src\index.ts"

echo [INFO] Aguardando backend inicializar...
timeout /t 7 /nobreak >nul

:: ====== INICIAR FRONTEND ======
echo [INFO] Iniciando frontend (porta 3000)...
cd /d "%BASE_DIR%\frontend"
start "Frontend PUCPR :3000" cmd /k ""%NODE_EXE%" node_modules\.bin\vite --port 3000"

echo [INFO] Aguardando frontend inicializar...
timeout /t 8 /nobreak >nul

:: ====== ABRIR NAVEGADOR ======
echo [INFO] Abrindo navegador...
start "" "http://localhost:3000"

echo.
echo =====================================================
echo   [OK] Portal iniciado com sucesso!
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:3001/api/health
echo.
echo   Para encerrar: feche as janelas do terminal.
echo =====================================================
echo.
pause
