@echo off
title TV Corporativa — Dev Local
color 0A
echo.
echo  =============================================
echo   TV CORPORATIVA — AMBIENTE DE DESENVOLVIMENTO
echo  =============================================
echo.

REM ── 1. Sincronizar banco de dados da producao ──────────────
echo [1/3] Sincronizando banco de dados da producao...
set SRC=\\10.100.8.46\bitsafe\backend\pb_data\data.db
set DST=%~dp0backend\pb_data\data.db

if exist "%SRC%" (
  copy /Y "%SRC%" "%DST%" >nul 2>&1
  if %errorlevel%==0 (
    echo       OK - banco sincronizado com producao
  ) else (
    echo       AVISO - nao foi possivel copiar. Usando banco local existente.
  )
) else (
  echo       AVISO - servidor de producao nao acessivel. Usando banco local existente.
)
echo.

REM ── 2. Iniciar PocketBase ──────────────────────────────────
echo [2/3] Iniciando PocketBase (banco local)...
start "PocketBase - Dev" cmd /k "cd /d %~dp0backend && pocketbase.exe serve --http=127.0.0.1:8090 && pause"
timeout /t 2 /nobreak >nul
echo       OK - http://127.0.0.1:8090/_/
echo.

REM ── 3. Iniciar Frontend ────────────────────────────────────
echo [3/3] Iniciando Frontend SvelteKit...
start "Frontend - Dev" cmd /k "cd /d %~dp0frontend && powershell -Command \"Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force\" && set NODE_ENV=development && npm run dev && pause"
timeout /t 3 /nobreak >nul
echo       OK - http://localhost:5173
echo.

echo  =============================================
echo   TUDO PRONTO!
echo.
echo   Painel admin : http://localhost:5173/admin
echo   Tela TV      : http://localhost:5173/tv
echo   PocketBase   : http://127.0.0.1:8090/_/
echo  =============================================
echo.
pause
