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

# enviar notificacao do status do backup no discord

# Configurações do Discord

# Captura o status do comando de backup anterior (0 = sucesso)
BACKUP_STATUS=$?

# URL do seu Webhook
WEBHOOK_URL="https://discord.com/api/webhooks/1542595324118306847/LZIFOVB173HkmHCkJW-J-1PrdRdqW1DmUT8F9qPDjgcfCabaB9FNuvtiatemqRbUk8Xj"

if [ $BACKUP_STATUS -eq 0 ]; then
    # Mensagem de SUCESSO
    curl -H "Content-Type: application/json" \
         -X POST \
         -d '{"content": "✅ **[Cardápio Web]** Backup do banco de dados realizado com sucesso!"}' \
         "$WEBHOOK_URL"
else
    # Mensagem de ERRO
    curl -H "Content-Type: application/json" \
         -X POST \
         -d '{"content": "🚨 **[ERRO CRÍTICO]** O backup do banco de dados FALHOU! Verifique os logs no servidor imediatamente."}' \
         "$WEBHOOK_URL"
fi
