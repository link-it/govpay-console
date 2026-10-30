<p align="center">
<img src="https://www.link.it/wp-content/uploads/2025/01/logo-govpay.svg" alt="GovPay Logo" width="200"/>
</p>

# GovPay - Porta di accesso al sistema pagoPA - Console

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=link-it_govpay-console&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=link-it_govpay-console)
[![Docker Hub](https://img.shields.io/docker/v/linkitaly/govpay-console?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/linkitaly/govpay-console)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://raw.githubusercontent.com/link-it/govpay-console/main/LICENSE)
[![Angular](https://img.shields.io/github/package-json/dependency-version/link-it/govpay-console/@angular/core?label=Angular&logo=angular&color=dd0031)](https://angular.dev)

Console web di backoffice di GovPay: permette agli operatori di consultare e gestire pendenze, ricevute, rendicontazioni, anagrafiche, utenze e impostazioni tramite le API di [govpay-console-api](https://github.com/link-it/govpay-console-api).

## Sommario

Nuova versione della console di backoffice GovPay, riscrittura completa della console legacy Angular 5. È un'applicazione a pagina singola: la build produce solo file statici, serviti da nginx nell'immagine Docker o da qualsiasi web server.

Stack: **Angular 21** standalone, **Signals**, **TailwindCSS 4**, **Angular Material**. Il workspace è strutturato come **seed riusabile** per altri progetti Link.it e contiene due progetti Angular:

| Progetto | Percorso | Contenuto |
|----------|----------|-----------|
| `govpay-console` | `projects/govpay-console` | L'applicazione |
| `lnk-shared-ui` | `projects/lnk-shared-ui` | Libreria condivisa `@linkit/shared-ui` (vedi [Libreria condivisa](#libreria-condivisa-linkitshared-ui)) |

Aree funzionali della console, attivabili singolarmente dalla configurazione (`Features`): pendenze, ricevute, pagamenti, riscossioni, rendicontazioni, incassi, giornale degli eventi, tracciati, domini, tipi pendenza, entrate, applicazioni, intermediari, operatori, ruoli, operazioni di manutenzione e impostazioni.

## Integrazione con GovPay

| Componente | Quando serve | Obbligatorio | Ruolo |
|------------|--------------|--------------|-------|
| [govpay-console-api](https://github.com/link-it/govpay-console-api) | runtime | sì | Backend della console: tutte le chiamate dell'app vanno a `GOVAPI.GOVPAY` (default `/govpay-console-api`), compresi login, logout e profilo utente |
| Autenticazione di govpay-console-api | runtime | sì | La console non autentica da sé: supporta le modalità `Basic`, `Spid`, `Iam` e `OAuth2` (chiave `Auth`), le ultime tre per redirect verso gli endpoint esposti dal backend. Dopo il login la sessione è gestita dal backend con cookie (`JSESSIONID`) e token XSRF (`X-XSRF-TOKEN`) |
| Reverse proxy | runtime | no | Serve per esporre console e API sullo stesso dominio ed evitare CORS: nel container lo fa nginx con `GOVPAY_API_BACKEND`, in sviluppo `proxy.config.js` |
| [@linkit/shared-ui](#libreria-condivisa-linkitshared-ui) | build | sì | Libreria di componenti e servizi condivisi, inclusa nel repository come copia mirror |
| Node.js e npm | build | sì | Compilazione dell'app; non servono a runtime |

Il path `/govpay/backend/api/backoffice` (API di backoffice di GovPay 3.x) è ancora inoltrato dal proxy di sviluppo come fallback per installazioni locali, ma l'app non lo usa di default.

## Compilazione

Requisiti: Node.js 22 (versione in [.nvmrc](.nvmrc), oggi `22.13`; è la stessa usata dalla pipeline e dall'immagine `node:22.13-alpine`) e npm 10 (`packageManager` in `package.json`: `npm@10.9.0`).

```bash
nvm use                # usa la versione di Node indicata in .nvmrc
npm ci                 # installa le dipendenze esattamente come in package-lock.json
npm run build          # build dell'app (configurazione di default: production)
```

Altri comandi di build:

```bash
npm run build:prod     # build di production esplicita, usata da pipeline e Dockerfile
npm run build:lib      # libreria @linkit/shared-ui (development, ng-packagr)
npm run build:lib:prod # libreria (production)
npm run watch          # build development continua
```

Prima di ogni build (`prebuild`) e di ogni avvio (`prestart`) viene eseguito `npm run build:meta`, che rigenera `projects/govpay-console/src/environments/version.ts` (vedi [Versionamento](#versionamento)) e unisce i file di traduzione della libreria e dell'app in `projects/govpay-console/src/assets/i18n/<lingua>.json` (`scripts/merge-i18n.js`). Entrambi i file sono generati e non vanno modificati a mano.

L'output dell'app finisce in `dist/govpay-console/browser/`, quello della libreria in `dist/lnk-shared-ui/`.

## Configurazione

L'applicazione non ha configurazione di build per ambiente: legge tutto a runtime, all'avvio nel browser, da file JSON serviti insieme all'app in `assets/config/`. I file si possono sostituire nell'installazione (nel container con un volume) senza ricompilare.

| File | Contenuto |
|------|-----------|
| `assets/config/app-config.json` / `app-config.dev.json` | Configurazione applicativa (chiavi sotto) |
| `assets/config/themes/*.json` | Temi: logo, colori, font. Quello di avvio è indicato da `Layout.themeUrl` (default `assets/config/theme.json`) |
| `assets/config/<area>-config.json` | Presentazione delle liste di ogni area (colonne, etichette e colori degli stati, `persistState`) |

Il file di configurazione applicativa caricato è quello indicato da `configFile` in `environments/environment.ts`, cioè `assets/config/app-config.dev.json`. `environment.prod.ts` punta ad `app-config.json`, ma `angular.json` non lo sostituisce in nessuna configurazione di build: anche la build di production (e quindi l'immagine Docker) carica `app-config.dev.json`. Per cambiare la configurazione di un'installazione va quindi sovrascritto `app-config.dev.json`.

### Chiavi di `AppConfig`

| Chiave | Valore nel file | Descrizione |
|--------|-----------------|-------------|
| `app.name` | `govpay-console` | Identificativo dell'applicazione |
| `app.title` | `GovPay Console` (`GovPay Console (DEV)` nel file dev) | Titolo, usato anche come titolo della pagina |
| `app.subtitle` | - | Sottotitolo (opzionale) |
| `app.description` | `Console di backoffice GovPay` | Descrizione |
| `app.version` | `4.2.0` (solo in `app-config.json`) | Non usata: la versione mostrata viene da `version.ts` |
| `STANDALONE` | `true` | Presente nel modello di configurazione, non letta dall'app |
| `GOVAPI.GOVPAY` | `/govpay-console-api` | Base URL di govpay-console-api, assoluto o relativo alla radice del sito |
| `GOVAPI.CONSOLE` | - | Base URL alternativo usato dal client delle API V2; se assente vale `/govpay-console-api` |
| `GOVAPI.GOVHUB` | `""` | Presente nel modello di configurazione, non letta dall'app |
| `Auth.Modes` | `Basic`, `Spid`, `Iam`, `OAuth2` | Modalità di login offerte nella pagina di accesso |
| `Auth.Default` | `Basic` | Modalità proposta di default |
| `Auth.Endpoints.login` | `/login` | Endpoint di login, relativo a `GOVAPI.GOVPAY` |
| `Auth.Endpoints.logout` | `/logout` | Endpoint di logout; se la risposta contiene `logoutUrl` il browser viene reindirizzato lì |
| `Auth.Endpoints.spid` | `/spid/login` | Endpoint del login SPID (redirect) |
| `Auth.Endpoints.oauth2` | `/oauth2/authorize` | Endpoint del login OAuth2 (redirect) |
| `Auth.Endpoints.iam` | `/iam/login` | Endpoint del login IAM (redirect) |
| `Layout.showHeaderBar` | `true` | Mostra la barra di intestazione |
| `Layout.showFooterBar` | `false` | Mostra il piè di pagina |
| `Layout.footerHeight` | - | Altezza del piè di pagina |
| `Layout.profileMenuPosition` | `sidebar` | Posizione del menu profilo: `header`, `sidebar`, `none` |
| `Layout.darkModeTogglePosition` | `none` (`sidebar` nel file dev) | Posizione del selettore chiaro/scuro: `header`, `sidebar`, `none` |
| `Layout.languageSelectorPosition` | `none` (`sidebar` nel file dev) | Posizione del selettore della lingua: `header`, `sidebar`, `none` |
| `Layout.settingsMenuPosition` | `sidebar` | Dove compare la voce Impostazioni: `sidebar` o `profile` |
| `Layout.themeUrl` | `assets/config/themes/govpay-a11y.json` | Tema caricato all'avvio |
| `Layout.themes` | 17 temi | Temi selezionabili dal pannello tweaks (`id`, `label`, `url`, `color`) |
| `Layout.languages` | `it`, `en` | Lingue disponibili (`code`, `label`, `short`, `flag`) |
| `Layout.defaultLanguage` | `it` | Lingua di avvio |
| `Layout.showAbout` | `true` | Mostra la voce About (pagina `/about`) |
| `Layout.showVersion` | `true` | Mostra la versione in fondo alla sidebar |
| `Layout.showBuild` | `false` (`true` nel file dev) | Aggiunge alla versione l'hash git della build |
| `Layout.profileMenuExtraItems` | link alla guida utente | Voci aggiuntive del menu profilo (`labelKey`, `icon`, `link`, `target`) |
| `Layout.sidebarFooterItems` | `[]` | Voci aggiuntive in fondo alla sidebar |
| `Layout.listView` | `table` | Visualizzazione delle liste: `table` o `rows` |
| `Layout.listViewByFeature` | `rows` per pendenze, domini, giornale eventi, applicazioni, tracciati, rendicontazioni, intermediari | Visualizzazione per singola area |
| `Layout.searchPillVariant` | `square` | Forma della barra di ricerca: `pill` o `square` |
| `Layout.searchPillDensity` | - (`compact`) | Densità della barra di ricerca: `compact`, `regular`, `comfortable` |
| `Layout.gotoTopButton` | `true` | Pulsante "torna su" |
| `Layout.helpButton` | `true` | Pulsante di aiuto contestuale |
| `Layout.tweaksPanel` | `true` | Pannello tweaks per la personalizzazione della vista |
| `Layout.listMaxWidth` | `none` | Larghezza massima delle pagine lista |
| `Layout.detailMaxWidth` | `64rem` | Larghezza massima delle pagine dettaglio |
| `Features.GESTIONE_*` | `true` | Abilitano i gruppi del menu: `PAGAMENTI`, `RISCOSSIONI`, `MONITORAGGIO`, `ANAGRAFICHE`, `SICUREZZA`, `MANUTENZIONE`, `IMPOSTAZIONI` |
| `Features.MENU_*` | `true`, tranne `PAGAMENTI`, `RISCOSSIONI`, `INCASSI` a `false` | Abilitano le singole voci: `PENDENZE`, `RICEVUTE`, `PAGAMENTI`, `RISCOSSIONI`, `RENDICONTAZIONI`, `INCASSI`, `GIORNALE_EVENTI`, `TRACCIATI`, `DOMINI`, `TIPI_PENDENZA`, `ENTRATE`, `APPLICAZIONI`, `INTERMEDIARI`, `OPERATORI`, `RUOLI`, `OPERAZIONI`, `IMPOSTAZIONI` |
| `Preferences.TIMEOUT` | `30000` | Presente nel file, non letta dall'app |
| `Preferences.PAGE_SIZE` | `25` | Presente nel file, non letta dall'app (le liste usano una dimensione di pagina fissa) |
| `Maintenance.enabled` | `false` | Se `true` ogni pagina della console reindirizza alla pagina di manutenzione |
| `Maintenance.title` | `Servizio in manutenzione` | Titolo della pagina di manutenzione (testo o chiave di traduzione) |
| `Maintenance.message` | testo di cortesia | Messaggio della pagina di manutenzione (testo o chiave di traduzione) |
| `Maintenance.estimatedEnd` | - | Fine prevista dell'intervento, mostrata se valorizzata |
| `Maintenance.icon` | `bootstrapGear` | Icona della pagina di manutenzione |

I file vengono richiesti con un parametro anti-cache, quindi una modifica è visibile al ricaricamento della pagina.

### Multi-tenant

La stessa installazione può servire più tenant. Il tenant viene ricavato, nell'ordine, da:

1. query param `?tenant=<nome>`;
2. sottodominio (`<nome>.dominio.it`, se l'host ha almeno tre parti);
3. altrimenti `default`.

Oggi il tenant serve solo come spazio dei nomi delle preferenze salvate nel browser (es. lo stato della sidebar, chiave `lnk-sidebar-collapsed-<tenant>`): tema, branding e configurazione sono gli stessi per tutti i tenant.

## Esecuzione

### Sviluppo locale

```bash
nvm use
npm ci
npm start              # ng serve con proxy verso il backend del preset "local"
```

L'app risponde su `http://localhost:4200` (`npm run start:port` la avvia sulla porta `5300`). Il server di sviluppo usa la configurazione `development` e ricarica l'app a ogni modifica.

### Proxy di sviluppo

Le chiamate a `/govpay-console-api/*` e `/govpay/backend/api/backoffice/*` sono inoltrate, con lo stesso path, al backend scelto con un preset di `proxy.config.js`. Il proxy riscrive il dominio dei cookie di sessione su `localhost` e scrive nel log ogni richiesta inoltrata (`[proxy →]`).

| Comando | Preset | Target |
|---|---|---|
| `npm start` | `local` | `http://172.16.2.109:8080` |
| `npm run start:local-alt` | `local-alt` | `http://172.16.1.121:8082` |
| `npm run start:dev` | `dev-cloud` | `https://dev.govcloud.it` |
| `npm run start:demo` | `demo` | `https://new-frontend.link.it` |
| `npm run start:demo-v2` | `demo-v2` | `https://lab.link.it` (GovPay Console API V2) |

Override manuale:

```bash
GP_BACKEND=dev-cloud ng serve --proxy-config proxy.config.js
```

Per aggiungere o modificare un preset, editare `BACKENDS` in `proxy.config.js`. Con un preset sconosciuto il server di sviluppo non parte e indica quelli disponibili.

## Esecuzione con Docker

Le immagini sono pubblicate su Docker Hub come [linkitaly/govpay-console](https://hub.docker.com/r/linkitaly/govpay-console) (release, a ogni tag `X.Y.Z` uguale alla versione di `package.json`; tag `X.Y.Z` e `X.Y`) e [linkitaly/govpay-console-dev](https://hub.docker.com/r/linkitaly/govpay-console-dev) (sviluppo, a ogni push su `main`; tag `main` e `sha-<commit>`). Contengono la build di production servita da nginx; la pipeline le costruisce con `docker/govpay-console/Dockerfile.daFile` e nginx risponde sulla porta `80`.

```bash
docker run -d --name govpay-console -p 8080:80 \
  -e GOVPAY_API_BACKEND=http://govpay-console-api:8080 \
  linkitaly/govpay-console-dev:main
```

La console è poi su `http://localhost:8080`. Per sovrascrivere la configurazione applicativa senza ricostruire l'immagine si monta un file al posto di quello di default (vedi [Configurazione](#configurazione)):

```bash
docker run -d --name govpay-console -p 8080:80 \
  -v ./app-config.json:/usr/share/nginx/html/assets/config/app-config.dev.json:ro \
  linkitaly/govpay-console-dev:main
```

Variabili d'ambiente lette dall'entrypoint (`docker/commons/entrypoint.sh`), che genera a ogni avvio la configurazione di nginx:

| Variabile | Obbligatoria | Default | Descrizione |
|-----------|--------------|---------|-------------|
| `SERVER_PORT` | no | `80` (`8080` con `docker/Dockerfile`) | Porta su cui ascolta nginx nel container |
| `GOVPAY_CONSOLE_BASE_PATH` | no | `/` | Base path da cui è servita la console, es. `/govpay-console` per un'installazione su `https://host/govpay-console/`. Viene scritto nel tag `<base href>` di `index.html`; ammessi solo caratteri validi in un path |
| `GOVPAY_API_BACKEND` | no | - | Se valorizzata, nginx fa da reverse proxy per `/govpay-console-api/` verso questo backend (es. `https://govpay.example.org`), evitando problemi di CORS. Se vuota la console chiama `GOVAPI.GOVPAY` direttamente |
| `GOVPAY_API_BACKEND_PATH` | no | `/govpay/console-api` | Path upstream sul backend a cui mappare `/govpay-console-api/*`, come dichiarato in `openapi.yaml` di govpay-console-api. Usare `/` se il backend serve gli endpoint alla radice: il prefisso viene rimosso prima dell'inoltro |
| `GOVPAY_CONSOLE_HOME` | no | `/usr/share/nginx/html` | Directory dei file statici; si cambia alla costruzione dell'immagine (`build_image.sh -e`), non a runtime |
| `GOVPAY_CONSOLE_LOGDIR` | no | `/var/log/govpay-console` | Directory dei log di nginx (`access.log`, `error.log`); si cambia alla costruzione dell'immagine (`build_image.sh -f`) |
| `GOVPAY_CONSOLE_FULLVERSION` | no | versione dell'immagine | Solo informativa, impostata alla costruzione |
| `TZ` | no | `Europe/Rome` | Fuso orario del container |

Le altre variabili usate nell'entrypoint (`API_PROXY_BLOCK`, `BASE_LOCATION_BLOCK`, `INDEX_HTML`, `NGINX_CONF`, `UPSTREAM_PATH`) sono interne allo script e non vanno impostate.

Esempio con backend che espone gli endpoint alla radice (proxy same-origin, nessun CORS):

```bash
docker run --rm -p 8080:80 \
  -e GOVPAY_API_BACKEND=http://govpay-console-api:8080 \
  -e GOVPAY_API_BACKEND_PATH=/ \
  linkitaly/govpay-console-dev:main
```

Esempio di installazione servita su un base path diverso dalla radice:

```bash
docker run --rm -p 8080:80 \
  -e GOVPAY_CONSOLE_BASE_PATH=/govpay-console \
  linkitaly/govpay-console-dev:main
```

### Nota sul base path

`GOVPAY_CONSOLE_BASE_PATH` agisce **solo** sul tag `<base href>` di `index.html`. È sufficiente perché tutti gli URL prodotti dalla build sono relativi: asset, file di configurazione, traduzioni e rotte Angular si allineano di conseguenza, senza ricompilare l'immagine.

Il container serve l'applicazione sia dalla radice sia dal prefisso, quindi funziona in entrambi gli scenari di reverse proxy: sia che il proxy davanti rimuova il prefisso prima di inoltrare, sia che lo inoltri così com'è.

Il proxy delle API resta invece **alla radice** (`/govpay-console-api/`), perché `GOVAPI.GOVPAY` è un path assoluto e non segue il `<base href>`. Se il reverse proxy davanti instrada al container solo `/<base-path>/*`, va instradato esplicitamente anche `/govpay-console-api/*`, oppure va valorizzato `GOVAPI.GOVPAY` con il path completo.

### Costruzione dell'immagine in locale

Dai sorgenti, con il Dockerfile multi-stage `docker/Dockerfile` (stage Node per la build, nginx per il runtime; nginx su `8080`). Il build context è la radice del repository:

```bash
docker build -t govpay-console:local -f docker/Dockerfile .
docker run --rm -p 8080:8080 govpay-console:local
```

Oppure con docker compose, che usa lo stesso Dockerfile ed espone la console su `http://localhost:10012`:

```bash
docker compose up --build
```

Da una build Angular già pronta, con lo stesso Dockerfile della pipeline (`Dockerfile.daFile`):

```bash
npm run build:prod
./docker/build_image.sh -l dist/govpay-console/browser -v local   # immagine linkitaly/govpay-console:local
```

`build_image.sh` accetta anche `-t <repository>:<tag>` per il nome dell'immagine, `-e` e `-f` per le directory dei file e dei log. La scansione delle vulnerabilità dell'immagine è descritta in [docker/SCANSIONE.md](docker/SCANSIONE.md).

## Libreria condivisa `@linkit/shared-ui`

Il workspace è **multi-progetto**: oltre all'app `govpay-console` ospita la libreria `projects/lnk-shared-ui` (componenti, direttive, utility e servizi condivisi: data-table, pagination, page-header, item-row/list, ConfigService, ThemeLoaderService, SystemFacade, LanguageService, snackbar, tweaks, …).

È una **copia mirror** di un'unica source-of-truth upstream (`[GOVPAY]/govpay-console/projects/lnk-shared-ui`, indicata in `scripts/sync-shared-ui.config.json`): le modifiche vanno fatte upstream e poi sincronizzate. In sviluppo viene risolta buildless tramite i path alias TypeScript (`@linkit/shared-ui`); in production la compila `ng-packagr`.

```bash
npm run sync:lib status              # diff read-only vs upstream
npm run sync:lib sync                # rsync della lib dall'upstream (con conferma)
npm run sync:lib sync -- --build     # rsync + build di validazione
```

Le opzioni complete sono descritte in testa a `scripts/sync-shared-ui.mjs`.

## Test

```bash
npm test               # vitest watch (app + libreria)
npm run test:run       # singolo run (app + libreria)
npm run test:coverage  # con coverage v8
npm run test:lib       # solo libreria @linkit/shared-ui
npm run test:app       # solo app
```

Ci sono anche le varianti `test:lib:watch`, `test:lib:coverage`, `test:app:watch` e `test:app:coverage`. Altri controlli:

```bash
npm run audit:ci       # audit delle dipendenze npm con le soglie di audit-ci.json
npm run license:check  # verifica dell'header di licenza nei sorgenti (license:add per aggiungerlo)
npm run a11y           # scansione di accessibilità WCAG 2.2 AA (richiede A11Y_TOOL e l'app avviata)
```

## Versionamento

Il file `projects/govpay-console/src/environments/version.ts` viene rigenerato automaticamente come `prebuild` da `scripts/generate-version.js` (legge `package.json`, raccoglie info git, scrive `VERSION`).

```bash
npm run version:generate         # rigenera version.ts
npm run version:patch            # 0.0.0 → 0.0.1 + rigenera
npm run version:minor            # 0.1.0
npm run version:major            # 1.0.0
npm run version:set 1.2.3        # imposta versione esatta
```

La pagina **About** (`/about`) mostra `getFullVersion()`. Il rilascio parte dal tag git, che deve coincidere con la versione di `package.json` e non essere una prerelease: la pipeline lo verifica prima di pubblicare l'immagine.

## Struttura

```text
projects/
├── govpay-console/src/app/
│   ├── core/        auth, interceptors, layout, services, models, ui (profile-menu), version
│   ├── features/    dashboard, pendenze, ricevute, pagamenti, …
│   └── (i componenti/servizi condivisi vivono nella libreria @linkit/shared-ui)
└── lnk-shared-ui/   libreria condivisa (components, directives, utils, core/{config,system,i18n,ui,layout})
```

> Nota: `@shared` e `@core/{config,system,i18n}` **non esistono più** nell'app: i loro contenuti sono in `@linkit/shared-ui`.

## Convenzioni

- Selettori prefissati `lnk-`.
- Tutti i componenti **standalone** + **OnPush**.
- Stato globale **signals-only**, no NgRx.
- Header licenza GPL v3 in cima ad ogni file `.ts`.
- Path alias: `@core/*`, `@feature/*`, `@environment`, `@environments`, `@assets/*`, `@linkit/shared-ui`.

## Licenza

GovPay Console è distribuito con licenza [GNU General Public License v3.0](LICENSE) (GPL-3.0-or-later), Link.it srl.
