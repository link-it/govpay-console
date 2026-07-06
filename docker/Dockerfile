##############################################################################
# GovPay Console - Dockerfile multi-stage (build dai sorgenti)
#
# Stage 1 (build): compila l'app Angular con Node
# Stage 2 (runtime): serve la build statica con nginx
#
# NOTA: il build context deve essere la root del repo (per accedere a
#       package.json, projects/, ecc.); questo Dockerfile va indicato con -f.
#
# Build (eseguire dalla root del repo):
#   docker build -t govpay-console:local -f docker/Dockerfile .
#
# Run:
#   docker run --rm -p 8080:8080 govpay-console:local
#   # poi apri http://localhost:8080
#
# Con proxy verso un backend GovPay (evita problemi di CORS):
#   docker run --rm -p 8080:8080 \
#     -e GOVPAY_API_BACKEND=https://lab.link.it \
#     govpay-console:local
##############################################################################

# ---------------------------------------------------------------------------
# Stage 1 - build
# ---------------------------------------------------------------------------
FROM node:22.13-alpine AS build

WORKDIR /app

# Installa le dipendenze sfruttando la cache di layer:
# copiamo prima i soli manifest, poi il resto del sorgente.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build di produzione (genera version.ts + ng build --configuration production).
# L'output finisce in dist/govpay-console/browser.
RUN npm run build:prod

# ---------------------------------------------------------------------------
# Stage 2 - runtime
# ---------------------------------------------------------------------------
FROM nginx:alpine

ARG govpay_console_fullversion=4.0.0
ARG govpay_console_home=/usr/share/nginx/html
ARG govpay_console_log=/var/log/govpay-console

LABEL maintainer="Link.it s.r.l."
LABEL description="GovPay Console"
LABEL govpay.console.version="${govpay_console_fullversion}"

ENV GOVPAY_CONSOLE_FULLVERSION=${govpay_console_fullversion} \
    GOVPAY_CONSOLE_LOGDIR=${govpay_console_log} \
    GOVPAY_CONSOLE_HOME=${govpay_console_home} \
    SERVER_PORT=8080 \
    TZ=Europe/Rome

RUN set -eux; \
    apk update; \
    apk upgrade; \
    apk add --no-cache bash curl tzdata; \
    rm -rf /var/cache/apk/*; \
    cp /usr/share/zoneinfo/${TZ} /etc/localtime; \
    echo "${TZ}" > /etc/timezone; \
    mkdir -p ${GOVPAY_CONSOLE_LOGDIR}

WORKDIR ${GOVPAY_CONSOLE_HOME}

# Copia la build statica dallo stage precedente
COPY --from=build /app/dist/govpay-console/browser/ ${GOVPAY_CONSOLE_HOME}/

# Copia l'entrypoint che genera la configurazione nginx a runtime
COPY docker/commons/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod ug=rx /usr/local/bin/entrypoint.sh

# Porta non privilegiata: l'immagine può girare anche come utente non-root
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD []
