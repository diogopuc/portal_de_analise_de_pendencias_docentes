@echo off
chcp 65001 >nul
title Portal de Pendências Docentes - PUCPR

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     PORTAL DE ANÁLISE DE PENDÊNCIAS DOCENTES - PUCPR    ║
echo ║                     Grupo Marista                        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: ====== DETECTAR NODE.JS ======
set NODE_PATH=
set NPM_PATH=

:: Tentar node no PATH
node --version >nul 2>&1
if %errorlevel% == 0 (
    set NODE_PATH=node
    set NPM_PATH=npm
    goto :node_found
)

:: Tentar node portable na pasta do usuário
if exist "%USERPROFILE%\node-portable" (
    for /d %%d in ("%USERPROFILE%\node-portable\node-v*") do (
        if exist "%%d\node.exe" (
            set NODE_PATH=%%d\node.exe
            set NPM_PATH=%%d\npm.cmd
            set PATH=%%d;%PATH%
            goto :node_found
        )
    )
)

:: Tentar instalação padrão do Windows
if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_PATH=C:\Program Files\nodejs\node.exe
    set NPM_PATH=C:\Program Files\nodejs\npm.cmd
    set PATH=C:\Program Files\nodejs;%PATH%
    goto :node_found
)

:: Tentar instalar com winget
echo [INFO] Node.js não encontrado. Tentando instalar...
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
if %errorlevel% == 0 (
    echo [OK] Node.js instalado com sucesso!
    set PATH=C:\Program Files\nodejs;%PATH%
    set NODE_PATH=node
    set NPM_PATH=npm
    goto :node_found
)

echo [ERRO] Não foi possível instalar o Node.js automaticamente.
echo        Acesse https://nodejs.org e instale manualmente.
pause
exit /b 1

:node_found
echo [OK] Node.js detectado.
%NODE_PATH% --version 2>&1 | findstr "v"

:: ====== DIRETÓRIO BASE ======
set BASE_DIR=%~dp0..
cd /d "%BASE_DIR%"
echo [INFO] Diretório base: %BASE_DIR%

:: ====== CRIAR ESTRUTURA ======
echo.
echo [INFO] Verificando estrutura de pastas...
if not exist "data\logs" mkdir "data\logs"
if not exist "data\relatorios" mkdir "data\relatorios"
if not exist "data\cache" mkdir "data\cache"
if not exist "temp" mkdir "temp"
echo [OK] Estrutura de pastas verificada.

:: ====== COPIAR EXCEL ======
if exist "Atv_Pendentes_Abril.xlsx" (
    if not exist "data\Atv_Pendentes_Abril.xlsx" (
        copy "Atv_Pendentes_Abril.xlsx" "data\" >nul
        echo [OK] Planilha copiada para data/
    )
)

:: ====== DEPENDÊNCIAS BACKEND ======
echo.
echo [INFO] Verificando dependências do backend...
cd /d "%BASE_DIR%\backend"
if not exist "node_modules" (
    echo [INFO] Instalando dependências do backend...
    call %NPM_PATH% install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependências do backend.
        pause
        exit /b 1
    )
    echo [OK] Dependências do backend instaladas.
) else (
    echo [OK] Dependências do backend já instaladas.
)

:: ====== DEPENDÊNCIAS FRONTEND ======
echo.
echo [INFO] Verificando dependências do frontend...
cd /d "%BASE_DIR%\frontend"
if not exist "node_modules" (
    echo [INFO] Instalando dependências do frontend...
    call %NPM_PATH% install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependências do frontend.
        pause
        exit /b 1
    )
    echo [OK] Dependências do frontend instaladas.
) else (
    echo [OK] Dependências do frontend já instaladas.
)

:: ====== .ENV DO BACKEND ======
cd /d "%BASE_DIR%\backend"
if not exist ".env" (
    echo PORT=3001 > .env
    echo NODE_ENV=development >> .env
    echo DATA_DIR=../data >> .env
    echo ASSETS_DIR=../assets >> .env
    echo TEMP_DIR=../temp >> .env
    echo [OK] Arquivo .env criado.
)

:: ====== INICIAR BACKEND ======
echo.
echo [INFO] Iniciando backend na porta 3001...
cd /d "%BASE_DIR%\backend"
start "Backend - Portal PUCPR" cmd /k "title Backend - Portal PUCPR && call %NPM_PATH% run dev"

:: Aguardar backend inicializar
echo [INFO] Aguardando backend inicializar...
timeout /t 6 /nobreak >nul

:: ====== INICIAR FRONTEND ======
echo [INFO] Iniciando frontend na porta 3000...
cd /d "%BASE_DIR%\frontend"
start "Frontend - Portal PUCPR" cmd /k "title Frontend - Portal PUCPR && call %NPM_PATH% run dev"

:: Aguardar frontend inicializar
echo [INFO] Aguardando frontend inicializar...
timeout /t 8 /nobreak >nul

:: ====== ABRIR NAVEGADOR ======
echo [INFO] Abrindo navegador...
start "" "http://localhost:3000"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  ✓ Portal iniciado com sucesso!                         ║
echo ║                                                          ║
echo ║  Frontend: http://localhost:3000                         ║
echo ║  Backend:  http://localhost:3001/api/health              ║
echo ║                                                          ║
echo ║  Para encerrar: feche as janelas do terminal             ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
pause
