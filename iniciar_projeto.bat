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
    goto :node_ok
)
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    goto :node_ok
)
if exist "%APPDATA%\nvm\current\node.exe" (
    set "PATH=%APPDATA%\nvm\current;%PATH%"
    goto :node_ok
)

echo [ERRO] Node.js nao encontrado. Instale em: https://nodejs.org
pause
exit /b 1

:node_ok
echo [OK] Node.js pronto.
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
if not exist "%~dp0backend\node_modules" (
    echo [INFO] Instalando dependencias do backend...
    pushd "%~dp0backend"
    call npm install
    if errorlevel 1 ( popd & echo [ERRO] Falha no backend. & pause & exit /b 1 )
    popd
    echo [OK] Backend instalado.
) else (
    echo [OK] Backend: dependencias OK.
)

:: ====== DEPENDENCIAS FRONTEND ======
if not exist "%~dp0frontend\node_modules" (
    echo [INFO] Instalando dependencias do frontend...
    pushd "%~dp0frontend"
    call npm install
    if errorlevel 1 ( popd & echo [ERRO] Falha no frontend. & pause & exit /b 1 )
    popd
    echo [OK] Frontend instalado.
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
)

:: ====== LIBERAR PORTAS ======
echo.
echo [INFO] Liberando portas 3000 e 3001...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul

:: ====== INICIAR BACKEND (background, nesta janela) ======
echo [INFO] Iniciando backend...
pushd "%~dp0backend"
start /B npm run dev >nul 2>nul
popd
echo [INFO] Aguardando backend (7s)...
timeout /t 7 /nobreak >nul

:: ====== INICIAR FRONTEND (background, nesta janela) ======
echo [INFO] Iniciando frontend...
pushd "%~dp0frontend"
start /B npm run dev >nul 2>nul
popd
echo [INFO] Aguardando frontend (8s)...
timeout /t 8 /nobreak >nul

:: ====== VERIFICAR PORTAS ======
netstat -aon 2>nul | findstr ":3001 " >nul
if errorlevel 1 echo [AVISO] Backend pode nao ter iniciado corretamente.
netstat -aon 2>nul | findstr ":3000 " >nul
if errorlevel 1 echo [AVISO] Frontend pode nao ter iniciado corretamente.

:: ====== ABRIR NAVEGADOR ======
echo [INFO] Abrindo navegador...
rundll32 url.dll,FileProtocolHandler http://localhost:3000

:: ====== MENU DE CONTROLE ======
:menu
cls
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
