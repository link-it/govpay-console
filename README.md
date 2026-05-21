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

Tutte le chiamate `/govpay/backend/api/backoffice/rs/*` sono inoltrate al backend tramite `proxy.config.js`. Il backend è selezionabile via preset:

| Comando | Preset | Target |
|---|---|---|
| `npm start` | `local` | `http://172.16.2.109:8080` |
| `npm run start:local-alt` | `local-alt` | `http://172.16.1.121:8082` |
| `npm run start:dev` | `dev-cloud` | `https://dev.govcloud.it` |
| `npm run start:demo` | `demo` | `https://demo.govcloud.it` |

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
`environment.configFile`.

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

## Convenzioni

- Selettori prefissati `lnk-`.
- Tutti i componenti **standalone** + **OnPush**.
- Stato globale **signals-only**, no NgRx.
- Header licenza GPL v3 in cima ad ogni file `.ts`.
- Path alias: `@core/*`, `@feature/*`, `@shared/*`, `@environment`, `@environments`.

## Licenza

GPL-3.0-or-later — Link.it srl.
