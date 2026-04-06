@echo off
echo Iniciando PocketBase (DEV LOCAL)...
echo Banco de dados: pb_data_dev\ (separado da producao)
echo.

REM Cria/atualiza o superusuario
pocketbase.exe superuser upsert guilherme@bitsafeti.com.br Familiarocha2026.

echo.
echo Painel admin: http://127.0.0.1:8090/_/
echo.
pocketbase.exe serve --http="127.0.0.1:8090"
pause
