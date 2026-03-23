@echo off
echo Iniciando PocketBase...
echo.

REM Cria/atualiza o superusuario automaticamente
pocketbase.exe superuser upsert guilherme@bitsafeti.com.br Familiarocha2026.

echo.
echo Painel admin: http://127.0.0.1:8090/_/
echo.
pocketbase.exe serve --http="127.0.0.1:8090"
pause
