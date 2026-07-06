#!/bin/bash

##############################################################################
# GovPay Console - Script di Entrypoint
#
# Configura nginx e avvia il server per l'applicazione Angular.
#
# Variabili d'ambiente supportate:
#   SERVER_PORT           Porta su cui ascolta nginx          (default: 80)
#   GOVPAY_CONSOLE_HOME   Document root dei file statici
#   GOVPAY_CONSOLE_LOGDIR Directory dei log di nginx
#   GOVPAY_API_BACKEND    Se valorizzata, nginx fa da reverse proxy per
#                         /govpay-api-backoffice verso questo backend
#                         (es: https://lab.link.it). Evita problemi di CORS.
#   GOVPAY_API_BACKEND_PATH
#                         Path upstream sul backend a cui mappare le chiamate
#                         /govpay-api-backoffice/* (default: /govpay-api-backoffice).
#                         Usare "/" se il backend serve gli endpoint alla radice
#                         (es. /rs/form/v1/...): in tal caso il prefisso
#                         /govpay-api-backoffice viene rimosso prima dell'inoltro.
##############################################################################

set -e

# Funzioni di logging
log_info() { echo -e "\033[0;32m[INFO]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_warn() { echo -e "\033[1;33m[WARN]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"; }

log_info "========================================"
log_info "Avvio Servizio GovPay Console"
log_info "========================================"

##############################################################################
# Configurazione porta server
##############################################################################

SERVER_PORT=${SERVER_PORT:-80}

##############################################################################
# Blocco opzionale di reverse proxy verso il backend GovPay
##############################################################################

# Path upstream sul backend (default: stesso prefisso, nessun rewrite)
GOVPAY_API_BACKEND_PATH="${GOVPAY_API_BACKEND_PATH:-/govpay-api-backoffice}"

API_PROXY_BLOCK=""
if [ -n "${GOVPAY_API_BACKEND}" ]; then
    # Rimuove eventuale slash finale dal backend
    BACKEND="${GOVPAY_API_BACKEND%/}"
    # Normalizza il path upstream: garantisce lo slash iniziale e rimuove
    # quello finale. "/" o stringa vuota -> upstream sulla radice del backend
    # (il prefisso /govpay-api-backoffice viene rimosso prima dell'inoltro).
    UPSTREAM_PATH="/${GOVPAY_API_BACKEND_PATH#/}"
    UPSTREAM_PATH="${UPSTREAM_PATH%/}"
    log_info "Reverse proxy /govpay-api-backoffice/ -> ${BACKEND}${UPSTREAM_PATH}/"
    API_PROXY_BLOCK=$(cat <<EOF

    location /govpay-api-backoffice/ {
        proxy_pass ${BACKEND}${UPSTREAM_PATH}/;
        proxy_set_header Host \$proxy_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_ssl_server_name on;
    }
EOF
)
else
    log_info "Reverse proxy API non configurato (GOVPAY_API_BACKEND non impostata)"
fi

##############################################################################
# Generazione configurazione nginx
##############################################################################

NGINX_CONF="/etc/nginx/conf.d/default.conf"

cat > "${NGINX_CONF}" <<EOF
server {
    listen ${SERVER_PORT};
    server_name _;
    root ${GOVPAY_CONSOLE_HOME};
    index index.html;

    # Compressione asset statici
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
${API_PROXY_BLOCK}
    access_log ${GOVPAY_CONSOLE_LOGDIR}/access.log;
    error_log ${GOVPAY_CONSOLE_LOGDIR}/error.log;
}
EOF

log_info "========================================"
log_info "Riepilogo Configurazione"
log_info "========================================"
log_info "Porta Server: ${SERVER_PORT}"
log_info "Document Root: ${GOVPAY_CONSOLE_HOME}"
log_info "Log Directory: ${GOVPAY_CONSOLE_LOGDIR}"
log_info "Backend API: ${GOVPAY_API_BACKEND:-<nessuno>}"
[ -n "${GOVPAY_API_BACKEND}" ] && log_info "Path upstream: ${UPSTREAM_PATH:-/}/"
log_info "========================================"

# Verifica della configurazione generata
nginx -t

##############################################################################
# Avvio nginx
##############################################################################

log_info "Avvio nginx..."
log_info "========================================"

exec nginx -g "daemon off;"
