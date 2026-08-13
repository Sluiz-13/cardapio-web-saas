#!/bin/bash
# Backup diário do banco do Menuair. Roda via cron na VPS.
#
# Guarda os dumps em /srv/menuair/backups — FORA de qualquer container,
# pra sobreviver a `docker compose down`, rebuild, ou até a perda dos
# containers. Mantém só os últimos 7 dias, apagando o resto sozinho.

set -e

BACKUP_DIR="/srv/menuair/backups"
CONTAINER="cardapio-web-saas-db"
DB_USER="cardapio"
DB_NAME="cardapio_web"
DATE=$(date +%Y-%m-%d_%H-%M)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# --clean/--if-exists: o dump já vem pronto pra restaurar por cima de um
# banco existente, sem precisar apagar tabela por tabela na mão antes.
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
  | gzip > "$BACKUP_DIR/backup_${DATE}.sql.gz"

# Apaga backups com mais de 7 dias — evita lotar o disco da VPS com o tempo.
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup salvo em $BACKUP_DIR/backup_${DATE}.sql.gz"