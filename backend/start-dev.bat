@echo off
echo Iniciando PocketBase (DEV LOCAL)...
echo Banco de dados: pb_data_dev\ (separado da producao)
echo.
set RECAPTCHA_BYPASS=true

REM Opcional: cria/atualiza o superusuario quando as variaveis estiverem definidas
if "%PB_SUPERUSER_EMAIL%"=="" goto skip_superuser
if "%PB_SUPERUSER_PASSWORD%"=="" goto skip_superuser
pocketbase.exe superuser upsert "%PB_SUPERUSER_EMAIL%" "%PB_SUPERUSER_PASSWORD%"
goto after_superuser

:skip_superuser
echo PB_SUPERUSER_EMAIL/PB_SUPERUSER_PASSWORD nao definidos; pulando upsert de superusuario.

:after_superuser

echo.
echo Painel admin: http://127.0.0.1:8090/_/
echo.
pocketbase.exe serve --http="127.0.0.1:8090"
pause
