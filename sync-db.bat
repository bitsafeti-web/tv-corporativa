@echo off
title Sincronizar banco de dados
echo.
echo  Sincronizando banco de dados da producao...
echo  Origem : \\10.100.8.46\bitsafe\backend\pb_data\data.db
echo  Destino: %~dp0backend\pb_data\data.db
echo.

set SRC=\\10.100.8.46\bitsafe\backend\pb_data\data.db
set DST=%~dp0backend\pb_data\data.db

if not exist "%SRC%" (
  echo  ERRO: Servidor de producao nao acessivel.
  echo  Verifique se voce esta na rede da empresa.
  echo.
  pause
  exit /b 1
)

REM Para o PocketBase local se estiver rodando
powershell -Command "Get-Process pocketbase -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 1 /nobreak >nul

copy /Y "%SRC%" "%DST%"
if %errorlevel%==0 (
  echo.
  echo  OK! Banco sincronizado com sucesso.
  echo  Reinicie o dev.bat para aplicar as alteracoes.
) else (
  echo.
  echo  ERRO ao copiar o arquivo.
)
echo.
pause
