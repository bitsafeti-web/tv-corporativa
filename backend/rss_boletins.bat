@echo off
:: Importa feeds RSS de cibersegurança para o Boletim Digital da TV.
:: Requer: backend\.env.rss configurado com PB_EMAIL e PB_PASSWORD
cd /d "%~dp0"
python rss_boletins.py
pause
