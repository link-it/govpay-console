# @linkit/shared-ui

<img src="https://img.shields.io/badge/version-0.9.0-blue" alt="version">
<img src="https://img.shields.io/badge/tests-318_passed-brightgreen" alt="tests">
<img src="https://img.shields.io/badge/coverage-87%25-green" alt="coverage">
<img src="https://img.shields.io/badge/Angular-21-dd0031" alt="angular">
<img src="https://img.shields.io/badge/license-GPL--3.0--or--later-lightgrey" alt="license">

Libreria condivisa di componenti, direttive, utility e infrastruttura
applicativa per i backoffice Link.it (Angular 21 + signals + Tailwind 4
+ Angular CDK). Da 0.7.0 la lib **non dipende più** da
`@angular/material`: tooltip via CDK Overlay
(`LnkTooltipDirective`), spinner CSS-only, niente
`MatProgressSpinnerModule` / `MatTooltipModule`.

Vive nel workspace di `govpay-console` come progetto Angular library
(`projects/lnk-shared-ui/`). I consumer dello stesso workspace la
importano via TS paths (`@linkit/shared-ui`) **senza build step** in
dev. Il build packagr serve solo per CI e per eventuale pubblicazione.

## Cosa contiene

### `utils/`

- `format.ts` — `formatDate`, `formatDateTime`, `formatNumber`,
  `daysAgoIso`, ecc.
- `display-options.ts` — `getBoxOptionStyle`, palette helpers.
- `sort.ts` — `formatOrdinamento`, `SortEvent` re-export type.
- `list-tweaks-options.ts` — `VIEW_OPTIONS`, `DATE_RANGE_OPTIONS`,
  `matchDateRangePreset` (costanti del pattern "tweaks panel sulle
  liste").

### `directives/`

- `lnkInfiniteScroll` — infinite scroll su un container scrollabile.
- `lnkListStickyToolbar` — toolbar sticky sotto l'header con shadow
  attivata oltre soglia di scroll.

### `components/`

18 componenti standalone, prefisso `lnk-`:

- **Liste**: `lnk-data-table` (con `ColumnDef<T>` + `cell:
  ItemTypeElement` opzionale), `lnk-item-list`, `lnk-item-row`,
  `lnk-item-type` (renderer driven-by-config), `lnk-pagination`,
  `lnk-list-refresh-banner` (banner Twitter-style "N nuovi
  elementi"; input `placement` `floating`/`sticky`/`inline`,
  `size` `sm`/`md`/`lg`, `color` `primary`/`secondary`/`custom`;
  pair con `createNewDataPoller()` di `core/system/`).
- **Detail**: `lnk-page-header` (con `titleSize` preset/arbitrary),
  `lnk-detail-section` (con `variant` `card`/`embedded`/`auto`),
  `lnk-detail-group` (container card che raggruppa piu` section,
  rendendole `embedded` via DI token `LNK_IN_DETAIL_GROUP`),
  `lnk-info-grid` (con `size` + `uppercaseLabels`), `lnk-tabs`
  (variant `underline`/`segmented` + size `md`/`sm`).
- **Navigazione**: `lnk-back-button` (default `Location.back()`,
  override via `targetRoute` per navigare via Router, output `back`
  con `preventDefault()` per intercettare).
- **Stati**: `lnk-empty-state` (icon o image + `size` preset),
  `lnk-loading` (inline o centered + size), `lnk-status-badge`.
- **Form**: `lnk-search-input` (con debounce), `lnk-select-input`,
  `lnk-date-input`.

### `core/system/`

- `SystemFacade` — sidebar collapsed, mobile menu, breadcrumbs, loading
  contatore, help sidebar, color scheme (`light` | `dark` | `auto`).
  Espone il token `BREADCRUMB_ICON_RESOLVER` per agganciare un
  resolver di icone fornito dal consumer.
- `ListStateService` — cache in-memory dei filtri/ordinamento per
  feature.
- `LayoutOverridesService` — override session-level di `LayoutConfig`.
- `createNewDataPoller(options)` — factory function (non service) che
  crea un poller signal-based: confronta periodicamente il `total`
  ritornato da `fetch()` con una baseline ed espone un `Signal<number>`
  con il delta dei nuovi elementi. Pair con `<lnk-list-refresh-banner>`.
  API `{ count, start, stop, reset }`.

### `core/config/`

- `AppConfig`, `BrandingConfig`, `LayoutConfig`, `AuthMode`,
  `ControlPosition`, `ExtraMenuItem` (tipi).
- `ConfigService` — carica `app-config*.json` + `theme.json` con
  cache-busting; multi-tenant runtime.
- `ThemeLoaderService` — applica CSS variables + classe `.dark` su
  `<html>`.

### `core/i18n/`

- `LanguageService` — wrapper signal-based di `TranslateService` con
  persistenza `lnk-locale`.

### `core/ui/`

Componenti UI riusabili:

- `lnk-snackbar` + `SnackbarService`.
- `lnk-goto-top` (FAB bottom-right).
- `lnk-spinner` (spinner overlay CSS-only legato a `SystemFacade.loading`).
- `lnk-placeholder` (rotta segnaposto).
- `lnk-color-scheme-toggle`.
- `lnk-language-menu`.
- `LnkTooltipDirective` (`[lnkTooltip]`) + `LnkTooltipComponent`
  (`<lnk-tooltip>`) — tooltip basato su CDK Overlay, alternativa
  portable a `MatTooltipModule`. Variants `default`/`info`/
  `warning`/`custom`, posizioni `above`/`below`/`left`/`right` con
  flip automatico, `lnkTooltipDisabled` per disattivare il binding
  in stati specifici (es. dropdown aperto), animazione "pop"
  (fade + scale 95→100, 150ms ease-out).
- `tweaks/` (pannello tweaks runtime: `TweaksRegistry`,
  `GlobalTweaksHostComponent`, building blocks `tweak-toggle`,
  `tweak-segmented`, `tweak-row`, `tweak-section`,
  `tweaks-panel`).

### `core/layout/`

- `lnk-help-sidebar` — pannello laterale "Aiuto".
- `lnk-maintenance` — pagina di manutenzione (controllata da
  `AppConfig.Maintenance`).

### `i18n/`

- `it.json`, `en.json` con i 14 namespace generici: `App`, `Common`,
  `Pagination`, `Tweaks`, `Auth`, `Layout`, `Profile`, `Theme`,
  `Language`, `Snackbar`, `Help`, `Maintenance`, `About`,
  `Placeholder`. I consumer mergiano queste chiavi con le loro di
  dominio via `scripts/merge-i18n.js`.

### `styles/`

- `styles/index.css` — foglio CSS della libreria (~350 LOC) con:
  - **CSS variables** del tema (default branding Link.it):
    `--primary`, `--card-bg`, `--card-border`, `--header-height`,
    palette `--status-{success,warning,danger,info,muted}-{bg,text}`,
    ecc. Il consumer può sovrascriverle dopo l'import per applicare
    il proprio branding.
  - **Scope `lnk-*`** per le variabili in conflitto con il sistema
    shadcn-HSL del consumer (`--primary`, `--foreground`, `--muted`,
    ecc.) ridefinite con hex direct nel sub-tree dei soli componenti
    lib. Le app shadcn-based mantengono il proprio theming senza
    rompere le arbitrary Tailwind utilities (`bg-[var(--card-bg)]`)
    interne ai componenti lib.
  - **Utility classes** vive referenziate dai template della lib:
    `.lnk-sep` / `.lnk-no-sep` (separatore `·` inline),
    `.lnk-list-page` / `.lnk-detail-page` (page wrapper centrato),
    `.lnk-link-hover` (colore primary in hover/focus su link),
    `.lnk-row-hover` (sfondo `--card-hover` in hover row),
    `.lnk-toolbar-stuck` (ombra toolbar sticky),
    `.lnk-header--scrolled` (backdrop blur header).
  - **Utility classes `.btn`** / `.btn-primary` / `.btn-secondary` /
    `.btn-ghost` / `.btn-sm` / `.btn-icon` / `.btn-block` che
    consumano `--lnk-btn-{primary,secondary}-*` in namespace isolato.

  Importazione dal consumer:

  ```css
  @import "../../lnk-shared-ui/src/styles/index.css";
  ```

## Come consumarla

### Workflow dev (buildless via TS paths)

Nel `tsconfig.json` del consumer:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@linkit/shared-ui": ["projects/lnk-shared-ui/src/public_api.ts"],
      "@linkit/shared-ui/*": ["projects/lnk-shared-ui/src/lib/*"]
    }
  }
}
```

E nel `tsconfig.app.json` del consumer:

```jsonc
{
  "compilerOptions": {
    "rootDir": "..",
    "types": []
  },
  "include": [
    "src/**/*.ts",
    "../lnk-shared-ui/src/**/*.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts",
    "src/test-setup.ts",
    "../lnk-shared-ui/src/**/*.spec.ts"
  ]
}
```

Stesso allargamento di `include` su `tsconfig.spec.json`. Senza
questo i sorgenti risolti via path alias non finiscono nel program
TS e il compiler esplode con
`Cannot destructure property 'pos' of file.referencedFiles[index]`.

### Provider richiesti dal consumer

In `app.config.ts`:

```ts
import { iconForNavLabel } from '@core/layout/nav';
import { BREADCRUMB_ICON_RESOLVER } from '@linkit/shared-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    { provide: BREADCRUMB_ICON_RESOLVER, useValue: iconForNavLabel },
  ],
};
```

Se non provisto, `SystemFacade.setBreadcrumbs` lascia gli items con
l'icona che hanno (o senza).

### i18n merge

Il consumer integra le 14 chiavi generiche della lib con le proprie
chiavi di dominio via `scripts/merge-i18n.js`:

```
projects/lnk-shared-ui/src/i18n/{it,en}.json       (lib, generiche)
projects/<consumer>/src/i18n-domain/{it,en}.json   (consumer, dominio)
       │
       ▼  scripts/merge-i18n.js  (deep merge, consumer override)
       │
projects/<consumer>/src/assets/i18n/{it,en}.json   (generato, .gitignored)
```

### Stili

Importa `styles/index.css` della libreria nello `styles.css` del
consumer per ottenere le CSS variables del tema + le utility class
(`.btn-*`, `.lnk-*`):

```css
@import "../../lnk-shared-ui/src/styles/index.css";

/* Override branding del consumer (opzionale, dopo l'import) */
:root {
  --primary: #my-brand-color;
}
```

Vedi sopra (`styles/`) per l'elenco delle variabili e utility class
distribuite.

## Build di validazione

Il workflow di sviluppo non richiede di buildare la lib (i sorgenti
sono risolti via TS paths). Il build via `ng-packagr` serve solo per:

- **CI**: validare che i contratti pubblici siano davvero buildabili
  come pacchetto npm (rileva dipendenze interne sfuggite, peer dep
  mancanti, ecc.).
- **Publishing**: produrre `dist/lnk-shared-ui/` con FESM + DTS
  pronti per `npm publish` se mai si arrivera` a pubblicarla.

```bash
npm run build:lib        # dev
npm run build:lib:prod   # production (partial compilation Ivy)
```

## Testing

La libreria ha 39 file di spec (~275 test) eseguiti con **Vitest** +
`@analogjs/vite-plugin-angular`. Coverage attuale: **~86% lines /
~91% funcs** (vedi badge in cima al README).

> I badge `version` / `tests` / `coverage` in cima sono statici
> (URL shields.io con valori cablati nel markdown). Per aggiornarli
> automaticamente in un colpo solo:
>
> ```bash
> npm run update-badges:lib
> ```
>
> Lo script (`scripts/update-badges.js`, target `lib`) esegue una
> run completa di vitest+coverage sulla lib, legge i numeri da
> `coverage/coverage-summary.json` e `coverage/test-results.json`, e
> riscrive le 3 righe badge dinamici (`version`, `tests`, `coverage`)
> nel README.
>
> Output in tag HTML `<img>` con URL shields.io path-based
> (`/badge/label-msg-color`) + escape `-`→`--`, `_`→`__`, ` `→`_`,
> `%`→`%25`. La scelta del tag HTML invece di markdown image syntax
> evita problemi di rendering in alcuni viewer (es. VS Code Markdown
> preview) con caratteri ripetuti nel messaggio. Il colore del badge
> coverage è scelto in base alla % lines (≥90 brightgreen, ≥80 green,
> ≥70 yellowgreen, ≥60 yellow, ≥50 orange, &lt;50 red).
>
> Lo stesso script supporta anche `app` (`npm run update-badges:app`)
> per aggiornare i badge nel `README.md` del workspace consumer.

```bash
npm run test:lib           # vitest run, solo lib (~275 test)
npm run test:lib:watch     # vitest watch, solo lib
npm run test:lib:coverage  # con coverage report (text + html + lcov)

npm run test:run           # tutti (lib + consumer, ~292 test)
npm run test:coverage      # coverage globale lib + consumer
```

`test-setup.ts` del workspace inizializza `TestBed` con
`BrowserDynamicTestingModule` + `platformBrowserDynamicTesting()`
(idempotente). I consumer che integrano la lib in un workspace
diverso devono replicare questo setup nel loro `test-setup.ts`.

**Pattern** (vedi spec esistenti):

- **Service**: `TestBed.inject(MyService)` con provider mock
  (`FakeTranslateLoader`, `FakeConfigService`, `FakeHttpClient`).
- **Component**: `TestBed.createComponent + setInput(name, value)`.
  Ogni `beforeEach` chiama `TestBed.resetTestingModule()` per evitare
  "Cannot configure the test module when the test module has already
  been instantiated".
- **Directive con timer / DOM**: `HostComponent` template-based +
  `vi.useFakeTimers()`.
- **Effect signal-based**: `TestBed.tick()` per flushare.
- **`IntersectionObserver`/`ResizeObserver`**: mockare con una
  classe registrata in stato condiviso (`vi.fn().mockImplementation`
  non funziona come constructor in vitest).

## Convenzioni interne

- Tra moduli della lib (es. da `lib/components/X/` a `lib/utils/`)
  usare **path relativi** (`../../utils`), MAI `@linkit/shared-ui`
  (ng-packagr rileva il self-import come circular dep).
- License header GPL v3 in tutti i `.ts`.
- Tutti i componenti `standalone: true` + `OnPush`.
- Selettori `lnk-*`.
- Style: CSS + Tailwind utility-first; niente bracket-arbitrary in
  `[class.x]` binding (vedi `styles.css` del consumer per le utility
  custom `.lnk-*`).

## Status

Vedi [CHANGELOG.md](./CHANGELOG.md) per la cronologia versioni e
[../../CLAUDE-NOTE/PIANO-LNK-SHARED-UI.md](../../CLAUDE-NOTE/PIANO-LNK-SHARED-UI.md)
per la strategia di evoluzione.
