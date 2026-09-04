<p align="center">
<img src="https://www.link.it/wp-content/uploads/2025/01/logo-govpay.svg" alt="GovPay Logo" width="200"/>
</p>

# GovPay Console v2

Nuova versione della console di backoffice GovPay (riscrittura completa della
console legacy Angular 5).

> Stack: **Angular 21+** standalone, **Signals**, **TailwindCSS 4**, **Angular Material**.
>
> Workspace strutturato come **seed riusabile** per altri progetti Link.it.

---

## Avvio rapido

```bash
nvm use                # usa Node 22 (vedi .nvmrc)
npm install
npm start              # backend default: 172.16.2.109:8080 (preset "local")
```

L'app risponderà su `http://localhost:4200`.

### Proxy di sviluppo

Tutte le chiamate `/govpay/backend/api/backoffice/rs/*` (e `/govway/in/RegioneSiciliana/*`) sono inoltrate al backend tramite `proxy.config.js`. Il backend è selezionabile via preset:

| Comando | Preset | Target |
|---|---|---|
| `npm start` | `local` | `http://172.16.2.109:8080` |
| `npm run start:local-alt` | `local-alt` | `http://172.16.1.121:8082` |
| `npm run start:dev` | `dev-cloud` | `https://dev.govcloud.it` |
| `npm run start:demo` | `demo` | `https://demo.govcloud.it` |
| `npm run start:sicilia` | `sicilia` | `https://gestionepagopatest.regione.sicilia.it` |

Override manuale:

```bash
GP_BACKEND=dev-cloud ng serve --proxy-config proxy.config.js
```

Per aggiungere/modificare un preset, edita `BACKENDS` in `proxy.config.js`.

## Build

```bash
npm run build          # development
npm run build:prod     # production con outputHashing
```

L'output finisce in `dist/govpay-console/browser/`.

## Test

```bash
npm test               # vitest watch
npm run test:run       # singolo run
npm run test:coverage  # con coverage v8
```

## Versionamento

Il file `projects/govpay-console/src/environments/version.ts` viene rigenerato
automaticamente come `prebuild` da `scripts/generate-version.js` (legge
`package.json`, raccoglie info git, scrive `VERSION`).

```bash
npm run version:generate         # rigenera version.ts
npm run version:patch            # 0.0.0 → 0.0.1 + rigenera
npm run version:minor            # 0.1.0
npm run version:major            # 1.0.0
npm run version:set 1.2.3        # imposta versione esatta
```

La pagina **About** (`/about`) mostra `getFullVersion()`.

## Configurazione runtime

L'applicazione carica al boot un file di configurazione JSON (vedi
`src/assets/config/app-config*.json`). La selezione tra dev/prod avviene tramite
`environment.configFile`. La struttura è documentata in
[`CALUDE-NOTE/ARCHITETTURA.md`](../CALUDE-NOTE/ARCHITETTURA.md).

### Multi-tenant runtime

L'app supporta più tenant senza rebuild. La selezione iniziale segue questo
ordine:

1. query param `?tenant=<name>`
2. sottodominio (`<name>.dominio.it`)
3. `localStorage` (chiave `lnk-tenant`)
4. `AppConfig.CurrentTenant`

`ConfigService.applyTenant(name)` cambia tema, branding e titolo del documento.

## Struttura

```text
projects/govpay-console/src/app/
├── core/        config, auth, interceptors, layout, system, version
├── features/    dashboard, pendenze, ricevute, pagamenti, … (placeholder M1)
└── shared/      componenti / directive / pipe condivise
```

Vedi [`CALUDE-NOTE/PIANO-LAVORO.md`](../CALUDE-NOTE/PIANO-LAVORO.md) per il piano
completo e le fasi di lavoro.

## Convenzioni

- Selettori prefissati `lnk-`.
- Tutti i componenti **standalone** + **OnPush**.
- Stato globale **signals-only**, no NgRx.
- Header licenza GPL v3 in cima ad ogni file `.ts`.
- Path alias: `@core/*`, `@feature/*`, `@shared/*`, `@environment`, `@environments`.

## Docker

Il progetto include `docker/Dockerfile`, un Dockerfile multi-stage che builda
l'applicazione dai sorgenti (stage Node) e la serve come contenuto statico
tramite nginx.

### Build & run

```bash
# Build dell'immagine (eseguire dalla root del repo: il build context è la root)
docker build -t govpay-console:local -f docker/Dockerfile .

# Avvio: l'app è servita su http://localhost:8080
docker run --rm -p 8080:8080 govpay-console:local
```

Oppure con docker compose (espone la console su `http://localhost:10012`):

```bash
docker compose up --build
```

### Configurazione runtime

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `SERVER_PORT` | `8080` | Porta su cui ascolta nginx nel container |
| `GOVPAY_CONSOLE_BASE_PATH` | `/` | Base path da cui è servita la console, es. `/govpay-console` per un'installazione su `https://host/govpay-console/`. Viene scritto nel tag `<base href>` di `index.html` |
| `GOVPAY_API_BACKEND` | _(vuota)_ | Se valorizzata, nginx fa da reverse proxy per `/govpay-console-api` verso questo backend, evitando problemi di CORS |
| `GOVPAY_API_BACKEND_PATH` | `/govpay/console-api` | Path upstream sul backend a cui mappare `/govpay-console-api/*`, come dichiarato in `openapi.yaml` di `govpay-console-api`. Usare `/` se il backend serve gli endpoint alla radice: il prefisso viene rimosso prima dell'inoltro |

Esempio con proxy verso un backend GovPay reale:

```bash
docker run --rm -p 8080:8080 \
  -e GOVPAY_API_BACKEND=https://lab.link.it \
  govpay-console:local
```

Esempio con backend che espone gli endpoint alla radice (proxy same-origin,
nessun CORS):

```bash
docker run --rm -p 8080:8080 \
  -e GOVPAY_API_BACKEND=http://govpay-console-api:8080 \
  -e GOVPAY_API_BACKEND_PATH=/ \
  govpay-console:local
```

Esempio di installazione servita su un base path diverso dalla radice:

```bash
docker run --rm -p 8080:8080 \
  -e GOVPAY_CONSOLE_BASE_PATH=/govpay-console \
  govpay-console:local
```

#### Nota sul base path

`GOVPAY_CONSOLE_BASE_PATH` agisce **solo** sul tag `<base href>` di
`index.html`. È sufficiente perché tutti gli URL prodotti dalla build sono
relativi: asset, file di configurazione, traduzioni e rotte Angular si
allineano di conseguenza, senza ricompilare l'immagine.

Il container serve l'applicazione sia dalla radice sia dal prefisso, quindi
funziona in entrambi gli scenari di reverse proxy: sia che il proxy davanti
rimuova il prefisso prima di inoltrare, sia che lo inoltri così com'è.

Il proxy delle API resta invece **alla radice**
(`/govpay-console-api/`), perché `GOVAPI.GOVPAY` in `app-config.json` è un
path assoluto e non segue il `<base href>`. Se il reverse proxy davanti
instrada al container solo `/<base-path>/*`, va instradato esplicitamente anche
`/govpay-console-api/*`, oppure va valorizzato `GOVAPI.GOVPAY` con il path
completo.

> La configurazione dell'app (titoli, endpoint, temi, ecc.) resta in
> `assets/config/app-config.json` ed è servita staticamente: può essere
> sovrascritta montando un volume su
> `/usr/share/nginx/html/assets/config/app-config.json`.

> Per le immagini basate su release pubblicate (download da GitHub o build
> locale già pronta) sono disponibili gli script in `docker/` (`build_image.sh`,
> con i relativi `Dockerfile.github` / `Dockerfile.daFile`).

## Licenza

GPL-3.0-or-later — Link.it srl.
