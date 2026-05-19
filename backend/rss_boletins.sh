#!/bin/bash
# Importa feeds RSS de cibersegurança para o Boletim Digital da TV.
# Requer: backend/.env.rss configurado com PB_EMAIL e PB_PASSWORD
#
# Para agendar via cron (a cada hora):
#   crontab -e
#   0 * * * * /home/bitsafe/tv-corporativa/backend/rss_boletins.sh >> /var/log/rss_boletins.log 2>&1

set -e
cd "$(dirname "$0")"
python3 rss_boletins.py
