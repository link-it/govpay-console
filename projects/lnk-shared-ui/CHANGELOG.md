# Changelog — @linkit/shared-ui

Cronologia versioni della libreria. Il formato segue
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il
versioning [Semantic Versioning](https://semver.org/lang/it/).

> Note: lo sviluppo del consumer (`govpay-console`) usa la lib via TS
> paths in dev (buildless), quindi i bump di versione qui sono
> rilevanti solo per CI e per eventuale pubblicazione futura su un
> registry. Vedi
> [../../CLAUDE-NOTE/PIANO-LNK-SHARED-UI.md](../../CLAUDE-NOTE/PIANO-LNK-SHARED-UI.md)
> §8 (versioning).

---

## [0.26.0] — 2026-07-10

### Aggiunto

- **`lnk-item-type` — attributo `wrap` per il testo** — il campo `text` può
  andare **a capo** (`break-words`, mostrato per intero — default) oppure essere
  **troncato** su una riga con ellissi (`wrap: false`), con il valore completo
  esposto nel `title` al passaggio del mouse. Nuovo campo `ItemTypeElement.wrap`.

---

## [0.25.2] — 2026-07-10

### Risolto

- **`lnk-page-header` — titolo e azioni sempre sulla stessa riga** — con titoli
  lunghi l'header andava a capo mandando i pulsanti sotto. Rimosso `flex-wrap`
  dall'header; l'area titolo/sottotitolo è `flex-1 min-w-0` (il titolo va a capo
  con `break-words`, mostrato per intero) e le azioni sono `shrink-0`, così
  restano sempre in linea a destra.

---

## [0.25.1] — 2026-07-07

### Risolto

- **`lnk-search-pill` — pannelli flottanti poco visibili in dark** — il popover
  filtri e il menu di ordinamento usavano ombre chiare (`rgba(16,24,40,…)`)
  impercettibili su sfondo scuro, confondendosi col contenuto sottostante.
  Aggiunto override in tema dark (`.dark`): ombra più profonda e bordo più
  marcato (`--sb-border-strong`) per staccare i pannelli.

---

## [0.25.0] — 2026-07-07

### Aggiunto

- **`lnk-info-grid` — size regolabile dai tweaks** — la dimensione tipografica
  delle info-grid è ora sovrascrivibile a runtime da un controllo globale nel
  pannello tweaks (`Tweaks.InfoGridSize`: S/M/L), con default `sm`. Il
  componente legge l'override da `LayoutOverridesService.infoGridSize` quando il
  consumer non passa un `size` esplicito; nuove chiavi i18n `Tweaks.InfoGridSize*`.

---

## [0.24.3] — 2026-07-07

### Modificato

- **`lnk-search-pill` — sort come pulsante segmentato** — la scorciatoia di
  direzione (icona) e il dropdown di selezione campo sono ora resi come un
  unico pulsante "grouped" coerente col pulsante filtri: stesso sfondo `chip`,
  nessun bordo esterno, solo il divisore verticale tra i due segmenti, angoli
  arrotondati agli estremi e hover (`chip-hover`) su ciascun segmento. Coerente
  nelle varianti pill e square.

## [0.24.2] — 2026-07-07

### Aggiunto

- **`lnk-search-pill` — scorciatoia direzione sort** — l'icona di sort nel
  trigger del dropdown è ora un pulsante cliccabile che inverte direttamente la
  direzione (asc↔desc) senza aprire il menu; il click sull'etichetta apre il
  menu di selezione campo. Le righe direzione restano disponibili nel menu.

## [0.24.1] — 2026-07-07

### Modificato

- **`lnk-search-pill` — icone di sort per la direzione** — il dropdown di
  ordinamento usa `bootstrapSortUp`/`bootstrapSortDown` (anziché i chevron) per
  indicare crescente/decrescente, sia nel trigger sia nelle righe del menu.

## [0.24.0] — 2026-07-07

### Aggiunto

- **`lnk-search-pill` — dropdown di ordinamento** — con `showSort` + `sortOptions`
  la barra mostra un dropdown per scegliere il campo di ordinamento e la
  direzione (crescente/decrescente). La selezione aggiorna `SearchState.sort`/
  `dir` ed emette `search`. Nuove label opzionali `SearchPillLabels.sortBy/
  sortAsc/sortDesc` (i18n `SearchPill.SortBy/SortAsc/SortDesc`).

## [0.23.0] — 2026-07-07

### Aggiunto

- **`lnk-search-pill` — densità selezionabile dai tweaks** — nuova costante
  `SEARCH_PILL_DENSITY_OPTIONS` (compact/regular/comfortable) per il pannello
  tweaks delle liste e nuovo campo `LayoutConfig.searchPillDensity`. L'input
  `density` del componente esisteva già; ora le liste possono esporlo come
  controllo runtime. Chiavi i18n `Tweaks.Density*`.

## [0.22.2] — 2026-07-06

### Modificato

- **`lnk-page-header` — allineamento in alto delle azioni** — l'header passa
  da `items-end` a `items-start`: i pulsanti nello slot azioni sono ora
  allineati al top del titolo (anziché al bordo inferiore), coerenti quando il
  sottotitolo va a capo o su più righe.

## [0.10.2] — 2026-07-02

### Risolto

- **`lnk-search-pill` — layout del popover filtri su mobile** — la griglia dei
  campi (`.form__grid`) era a 2 colonne fisse e su schermi stretti risultava
  compressa. Aggiunta media query `max-width: 640px`: griglia a colonna singola,
  footer (conteggio + azioni Chiudi/Cerca) impilato a piena larghezza, padding
  della form ridotto.

---

## [0.10.1] — 2026-07-02

### Risolto

- **`lnk-search-pill` — bottone "Cerca" invisibile all'hover** — `--sb-primary-hover`
  era mappato su `--lnk-btn-primary-hover`, variabile non sempre definita nel tema
  del consumer: l'hover del bottone primario del popover risolveva a `background`
  vuoto (trasparente) facendolo "sparire". Ora è derivato da `--primary` scurito
  via `color-mix`, senza dipendenze esterne.

---

## [0.10.0] — 2026-07-01

### Aggiunto

- **`lnk-search-pill`** — barra di ricerca "a pillola" config-driven (guidata
  da un array di `SearchField`): chip dei filtri attivi inline, popover filtri
  con stato *draft* (le modifiche/Reset si applicano solo su "Cerca"; Annulla/
  fuori-click le scartano), select ricercabile, toggle di ordinamento opzionale
  e autocomplete opzionale. Se non è configurato un campo `query` la barra non
  mostra l'input e il click apre il popover. Colori/superfici dalle variabili di
  tema (`--primary`, `--card-bg`, …) con dark automatico; icone `@ng-icons`.
  Sotto-componenti: `lnk-search-field`, `lnk-search-filter-form`,
  `lnk-search-chip`, `lnk-search-suggestions`; tipi/utility
  (`SearchField`, `SearchState`, `computeActiveChips`, `initialSearchState`, …).
- **`lnk-confirm-dialog`** — dialog di conferma generico (backdrop + card,
  label i18n, output `confirm`/`cancel`), controllato via input `open`.
- **`downloadBlob(blob, filename)`** — utility per lo scarico di file binari lato
  browser (object URL + anchor + revoke).

### Modificato

- **Header di licenza** — uniformato l'header di tutti i file `.ts` della
  libreria all'header generico Link.it (Copyright + GPL v3 completo), rimossi i
  riferimenti allo specifico applicativo "GovPay - Porta di Accesso al Nodo dei
  Pagamenti SPC". Solo commenti: nessuna API change.

---

## [0.9.4] — 2026-06-05

### Risolto

- **CSS variables scope override** — aggiunti
  `lnk-back-button`, `lnk-detail-group` e `lnk-list-refresh-banner`
  alla lista dei selector cui si applica lo scope override delle
  CSS variables `--primary` / `--primary-foreground` / `--foreground`
  / `--background` / `--muted` / `--muted-foreground` / `--border`
  / `--ring` in `styles/index.css`. Senza, i tre componenti
  perdevano i valori delle variabili nei consumer shadcn-based
  (es. govaudit): risultato visibile sul `<lnk-list-refresh-banner>`
  `placement="floating"` con `shape="pill"` `color="primary"` che
  appariva con background trasparente invece del rosso accent.
  Anche `<lnk-detail-group>` header e `<lnk-back-button>` color
  beneficiano del fix.

  `lnk-detail-group` e `lnk-back-button` aggiunti anche alla seconda
  lista (color foreground), per coerenza con gli altri componenti
  "container alto livello". `lnk-list-refresh-banner` escluso da
  quella lista: ha colori propri sul button interno
  (`--lnk-refresh-banner-{bg,text}`).

  Retrocompatibile: nessuna API change, solo selectors aggiuntivi.

---

## [0.9.3] — 2026-06-04

### Modificato

- **`<lnk-detail-section>` variant `embedded`** — border-bottom del
  section header ora allineato col primo glifo del `<h2>` titolo
  invece di estendersi per tutta la larghezza dell'`<header>`. Prima:
  il border sull'`<header>` partiva al lato sinistro del section
  (rientrato di 16 px rispetto al `<h2>` per via del `px-4` interno),
  dando la percezione visiva che il divider "sporgesse" a sinistra
  del titolo. Ora: il border-b e` sul `<h2>`, che ha la stessa x del
  primo glifo del titolo e si estende fino al lato destro
  dell'`<header>` content (allineato col content sottostante a
  destra). Variant `card` invariata.

  Implementazione:
  - `headerClass` ora computed dal variant: `card` resta
    `px-4 py-3 border-b border-[var(--card-border)]`, `embedded`
    diventa `px-4 pt-3` (no border, no padding-bottom).
  - `titleClass` ora computed: `embedded` aggiunge
    `pb-3 border-b border-[var(--card-border)]` al `<h2>`.

  Retrocompatibile: nessuna API change.

### Revert

- Revert del fix `0.9.2` (rimozione `p-4` host group). Quella
  modifica spostava tutto a sinistra di 16 px (titolo group + section
  embedded + content), creando un layout piu` "flush" alla card border
  ma cambiando la posizione delle section embedded rispetto al
  pattern storico. La causa del disallineamento percepito non era il
  `p-4` host del group, ma il border-b del section header che
  sporgeva a sinistra del titolo (vedi sopra). Host del group torna
  a `p-4`, header del group torna a `pb-3 mb-4 border-b`.

---

## [0.9.2] — 2026-06-04

### Risolto

- **`<lnk-detail-group>`** — disallineamento tra l'header del group
  e le header delle `<lnk-detail-section>` figlie:
  - il titolo del group (`<h2>`) era spostato 16 px a sinistra
    rispetto ai titoli delle section embedded;
  - il border-bottom dell'header del group e quello delle section
    avevano larghezze diverse (l'uno annidato in `p-4` host, l'altro
    full-width della section).

  Fix: rimosso `p-4` dall'host del group (sostituito con
  `overflow-hidden` per tenere il rounded-md sui bordi delle section
  embedded che ora arrivano al bordo del container). Header del
  group ora ha `px-4 py-3 border-b` — identico al padding delle
  section header embedded, risolve l'allineamento per costruzione.

  Effetti collaterali (intenzionali):
  - L'ultimo `<ng-content>` del group (es. una section embedded)
    arriva fino al bordo del container card senza padding extra del
    group: il padding interno e` interamente delegato alle section.
  - Tra header del group e prima section interna non c'e` piu`
    `mb-4`: lo spazio visivo arriva dal `py-3` della section
    header, leggermente piu` compatto ma coerente con la
    progressione header → header → header.

  Retrocompatibile: nessuna API change.

  **Nota**: questa modifica e` stata **revertita** in `0.9.3` — la
  causa del problema non era il `p-4` host del group ma il border-b
  del section header che sporgeva a sinistra del titolo.

---

## [0.9.1] — 2026-06-04

### Risolto

- **`<lnk-detail-group>`** — errore TS `TS2345: Argument of type
  'string | undefined' is not assignable to parameter of type
  'string'` su `{{ titleKey() | translate }}`. La guard
  `@if (titleKey())` non veniva propagata come narrowing dentro
  l'espressione del template (strict templates).

  Fix: alias `@if (titleKey(); as key)` + `{{ key | translate }}`.
  Crea una variabile di tipo `string` (non più `string | undefined`)
  all'interno del blocco. Nessun cambio runtime.

  Retrocompatibile.

---

## [0.9.0] — 2026-06-04

Pattern "gruppo di sezioni di dettaglio" per presentare informazioni
correlate come un'unica scheda visiva (vedi screenshot di
riferimento nel commit message).

### Aggiunto

- **`<lnk-detail-group>`** — container card che raggruppa piu`
  `<lnk-detail-section>` correlate eliminando i bordi delle section
  figlie. Utile quando piu` blocchi di informazioni sono
  semanticamente attinenti e devono apparire come un'unica scheda.
  - Input opzionale `titleKey` (i18n): se valorizzato, header con
    titolo + divider sotto.
  - Provider DI `LNK_IN_DETAIL_GROUP=true` letto dalle section figlie
    per attivare automaticamente la `variant='embedded'`.
  - Host class: `block rounded-md border border-[var(--card-border)]
    bg-[var(--card-bg)] shadow-[var(--card-shadow)] p-4`.
  - Lo spacing tra le section figlie e` ereditato dalla regola
    `:host:not(:last-of-type)` di `<lnk-detail-section>` (1.5rem),
    quindi il group non usa `space-y-*` per evitare doppio gap.

- **`<lnk-detail-section variant>`** — nuovo input per controllare
  l'aspetto:
  - `'card'`: bordo + bg + shadow + padding interno (look attuale).
  - `'embedded'`: niente bordo proprio, header con `pb-3 mb-3 border-b`
    (divider sotto il titolo) + content senza padding orizzontale,
    delegando il wrapping al container esterno.
  - `'auto'` (default): legge il token `LNK_IN_DETAIL_GROUP`;
    `embedded` se annidata in `<lnk-detail-group>`, `card` altrimenti.
    Permette di switchare tra layout senza toccare il template:
    basta wrappare le section in un group.

- **`LNK_IN_DETAIL_GROUP`** — `InjectionToken<boolean>` esportato dal
  barrel. Marker DI usato dal pattern group↔section. Esposto come
  API pubblica per consumer che vogliono implementare wrapper custom
  con la stessa semantica.

### Test

7 nuovi spec sul group (host classes, header condizionale al
titleKey, traduzione, provider DI, variant override esplicito da
section figlia, fallback fuori dal group) + 3 nuovi spec su
detail-section (variant default card, embedded esplicito, card
esplicito). Suite lib totale: 313/313 verdi (335/335 con app).

### Note di consumer-side

Refactor di una pagina di dettaglio esistente:

```html
<!-- Prima: 3 section adiacenti come card autonome -->
<lnk-detail-section titleKey="A"><lnk-info-grid ... /></lnk-detail-section>
<lnk-detail-section titleKey="B"><lnk-info-grid ... /></lnk-detail-section>
<lnk-detail-section titleKey="C"><lnk-info-grid ... /></lnk-detail-section>

<!-- Dopo: stesse section ma raggruppate in un'unica scheda -->
<lnk-detail-group titleKey="GroupTitle">
  <lnk-detail-section titleKey="A"><lnk-info-grid ... /></lnk-detail-section>
  <lnk-detail-section titleKey="B"><lnk-info-grid ... /></lnk-detail-section>
  <lnk-detail-section titleKey="C"><lnk-info-grid ... /></lnk-detail-section>
</lnk-detail-group>
```

Zero modifiche alle section: il group propaga `embedded` via DI.

---

## [0.8.0] — 2026-06-04

Pattern "Twitter-style new tweets banner" portato come componente
generico nella lib. Proposta documentata in
[`CLAUDE-NOTE/PROPOSTA-LIST-REFRESH-BANNER.md`](../../../CLAUDE-NOTE/PROPOSTA-LIST-REFRESH-BANNER.md).

### Aggiunto

- **`<lnk-list-refresh-banner>`** (`components/list-refresh-banner/`)
  — banner pillola "ci sono N nuovi elementi" da mostrare in cima a
  una lista. Componente presentazionale puro (zero deps su
  HttpClient/RxJS). API:
  - `count` (number | null | undefined, default 0): > 0 → banner
    visibile, testo include il count.
  - `show` (boolean | null, default null): override esplicito della
    visibilita` per scenari push/SSE senza count. `show=true` +
    `count=null` → banner con `genericMessageKey`.
  - `messageKey` (string, default `'Common.NewItems'`): i18n key con
    parametro `{{count}}`.
  - `genericMessageKey` (string, default `'Common.NewData'`):
    fallback per scenari push.
  - `iconName` (string, default `'bootstrapArrowClockwise'`).
  - `placement` (`'floating'` default | `'sticky'` | `'inline'`):
    floating = pillola `position: fixed` centrata sotto
    `--header-height + --lnk-list-toolbar-h` (stile "new tweets"),
    sticky = nel flow ma pinned durante lo scroll, inline = scrolla
    con la lista. Il floating centra il banner sulla colonna content
    leggendo `--lnk-content-left` (CSS variable esposta dal layout
    dell'app per indicare l'offset della sidebar fissa, fallback `0`).
  - `size` (`'sm'` | `'md'` default | `'lg'`): dimensione del pulsante
    (padding + font-size).
  - `color` (`'primary'` default | `'secondary'` | `'custom'`):
    variante stilistica. `secondary` riusa `--lnk-btn-secondary-*` della
    lib (bianco + testo denim + bordo cce3ed). `custom` lascia
    fallback su primary ma il consumer puo` overridare con
    `[style.--lnk-refresh-banner-bg]` / `[style.--lnk-refresh-banner-text]`
    senza forkare la lib.
  - `shape` (`'pill'` default | `'button'`): in `pill` mantiene la
    pillola arrotondata con shadow + animazione pop-in (look "new
    tweets"); in `button` delega lo stile alle classi utility `.btn`
    della lib (`.btn .btn-{primary|secondary}`, `+ .btn-sm` se
    `size='sm'`). Utile quando il banner e` slot azione di un
    page-header (placement `inline`) e serve coerenza visiva con
    gli altri pulsanti. In `button` il container usa `display:
    contents` per non aggiungere padding/wrapping.
  - output `refresh` — emette al click. Il consumer deve ricaricare
    e azzerare `count` (il banner non lo fa internamente).
  - Stile: pillola centrata, `var(--primary)` + `var(--primary-foreground)`,
    shadow + hover lift, animazione pop-in 180ms ease-out, attributi
    a11y (`role="status"`, `aria-live="polite"`, `aria-label`).
  - Override theming via CSS vars `--lnk-refresh-banner-{bg,text}`.

- **`createNewDataPoller()`** (`core/system/list-new-data-poller.ts`)
  — factory function che crea un poller signal-based per rilevare
  nuovi elementi tramite confronto periodico del `total` con una
  baseline. Pair tipico con il banner sopra. API:
  - `PollerOptions`: `fetch: () => Observable<number>`,
    `intervalMs?` (default 30_000), `initialTotal?` (omesso → il
    primo `fetch` stabilisce silenziosamente la baseline).
  - `NewDataPoller`: `count: Signal<number>` (delta corrente),
    `start()` (idempotente), `stop()` (idempotente),
    `reset(newBaseline?)`.
  - Implementazione RxJS: `interval(intervalMs).pipe(switchMap(fetch))`.
    `switchMap` cancella le request in volo (anti-race su rete
    lenta). Delta negativo (cancellazioni) ignorato per non
    "decrementare" il counter dei nuovi.

- **i18n keys** in `lib/i18n/{it,en}.json`:
  - `Common.NewItems` —
    `"{{count}} nuovi elementi disponibili"` /
    `"{{count}} new items available"`.
  - `Common.NewData` — `"Nuovi dati disponibili"` / `"New data available"`.

### Note di consumer-side

Esempio d'uso completo (polling 30s con factory poller):

```ts
private readonly poller = createNewDataPoller({
  fetch: () => this.api.countPendenze(this.filters()),
  intervalMs: 30_000,
});
readonly newItemsCount = this.poller.count;

constructor() {
  this.poller.start();
  inject(DestroyRef).onDestroy(() => this.poller.stop());
}

onRefreshClick(): void {
  this.refresh();
  this.poller.reset();
}
```

```html
<lnk-list-refresh-banner [count]="newItemsCount()" (refresh)="onRefreshClick()" />
```

Override stilistico (banner sticky con bottone secondary):

```html
<lnk-list-refresh-banner
  [count]="newItemsCount()"
  placement="sticky"
  size="sm"
  color="secondary"
  (refresh)="onRefreshClick()"
/>
```

Override colore custom via CSS variables (consumer-side, senza forkare):

```html
<lnk-list-refresh-banner
  [count]="newItemsCount()"
  color="custom"
  [style.--lnk-refresh-banner-bg]="'#7c3aed'"
  [style.--lnk-refresh-banner-text]="'#fff'"
  (refresh)="onRefreshClick()"
/>
```

Reference integration in `govpay-console`:
`features/pendenze/pendenze-list` espone tutte le combinazioni
(count mock, placement, size, color) come righe del pannello tweaks
runtime — utile come playground senza polling reale.

### Test

15 spec sul componente (count visibility, show override, click,
placement floating/sticky/inline, size sm/md/lg, color
primary/secondary/custom, iconName custom, messageKey custom) +
9 spec sul poller con `vi.useFakeTimers`. Suite lib totale:
303/303 test verdi (320/320 includendo i test dell'app consumer
`govpay-console`).

---

## [0.7.2] — 2026-06-02

### Risolto

- **`<lnk-tweaks-panel>` (placement `floating`)** — su schermi piccoli
  il pannello sforava dal top del viewport. Il `max-height` globale
  (`100vh - 1rem`) non rispettava il vincolo del `bottom: 12.5rem`
  (8.5rem su `>=1024px`), permettendo altezze totali che andavano
  oltre il top.

  Fix: `max-height: calc(100vh - 13.5rem)` mobile (`100vh - 9.5rem`
  desktop) sulla variante `--floating` in posizione di default, e
  `calc(100vh - 1rem)` quando dragged (`.is-positioned`). Il body
  interno (`.lnk-tweaks-body`) aveva gia` `overflow-y: auto`, quindi
  il contenuto scrolla automaticamente quando eccede l'altezza
  disponibile.

  Le varianti drawer (`--right` / `--left`) non sono toccate (gia`
  `top: 0; bottom: 0;` le limita al viewport).

  Retrocompatibile.

---

## [0.7.1] — 2026-06-02

Solo lavoro su test e tooling — nessun cambio API runtime.

### Aggiunto

- **Copertura test estesa**: da 37 a 292 test (+255, +689%), 48 file
  di spec. Tutti i componenti pubblici della libreria sono ora
  testati direttamente (15 components, 7 core/ui inclusi tweaks, 2
  core/layout, 8 services, 3 directives).
- **`test-setup.ts`** del workspace consumer ora inizializza
  `TestBed` con `BrowserDynamicTestingModule` +
  `platformBrowserDynamicTesting()` (idempotente). Necessario per
  i nuovi spec che usano `TestBed.createComponent`.
- **Script npm** del workspace consumer per filtrare i test per
  progetto: `test:lib`, `test:lib:watch`, `test:lib:coverage`,
  `test:app`, `test:app:watch`, `test:app:coverage`. Gli `*:coverage`
  passano `--coverage.include=<scope>` per restringere il report.
- **`vitest.config.mts`** coverage esteso a entrambi i progetti
  (`projects/lnk-shared-ui/src/lib/**/*.ts` +
  `projects/govpay-console/src/app/**/*.ts`).

### Coverage attuale della libreria

```
File               | % Stmts | % Branch | % Funcs | % Lines
All files (lib)    |   84.88 |    65.54 |   90.77 |   86.55
```

### Pattern di test adottati

- Service: `TestBed.inject` con provider mock (`FakeTranslateLoader`,
  `FakeConfigService`, `FakeHttpClient`).
- Component: `TestBed.createComponent` +
  `componentRef.setInput(name, value)` + `fixture.detectChanges()`.
  Tutti i `setup()` chiamano `TestBed.resetTestingModule()` per evitare
  "Cannot configure the test module when the test module has already
  been instantiated".
- Directive con event hook: `HostComponent` template-based +
  `vi.useFakeTimers()` per i timer.
- Effect Angular: `TestBed.tick()` dove serve flushare.
- `IntersectionObserver` mockato via classe registrata in stato
  condiviso (`vi.fn().mockImplementation` non funziona come constructor
  in vitest).

### Note di consumer-side

I consumer della libreria possono lanciare:

```bash
npm run test:lib            # solo lib (run)
npm run test:lib:watch      # solo lib (watch)
npm run test:lib:coverage   # solo lib (con coverage)
npm run test:app            # solo consumer (run)
npm run test:run            # entrambi (run)
npm run test:coverage       # entrambi (con coverage)
```

---

## [0.7.0] — 2026-05-31

Chiusura della migrazione **G2** (alternativa portable a
`@angular/material`): la libreria non importa più nulla da
`@angular/material/*`.

### Modificato

- **`<lnk-spinner>`** — sostituito `MatProgressSpinnerModule` con uno
  spinner CSS-only (border-top trasparente + `@keyframes lnk-spin`,
  stesso pattern già usato da `<lnk-loading>`). Dimensione fissa
  48 px, color `var(--primary)`. Comportamento runtime identico:
  reagisce a `SystemFacade.loading()`, mostra backdrop semi-trasparente
  centrato, attributi a11y invariati (`role="status"`,
  `aria-live="polite"`, `aria-busy="true"`).
  Retrocompatibile: nessun input pubblico, il consumer non deve
  modificare nulla.

### Rimosso

- **`@angular/material`** rimosso dalle `peerDependencies` del
  `package.json`. La libreria ora dipende solo da `@angular/cdk`
  (overlay + portal, usati da `LnkTooltipDirective`), animations,
  common, core, forms, router, `@ng-icons/*`,
  `@ngx-translate/core`, rxjs, tslib.

### Note di consumer-side

- I consumer che usano `@angular/material` per i loro scopi (es.
  `MAT_DATE_LOCALE` + `provideNativeDateAdapter` per il datepicker,
  come in `govpay-console`) devono continuare a dichiararlo come
  loro `dependency` o `peerDependency`: la libreria non lo trascina
  più transitivamente.
- I consumer che hanno usato la libreria fino alla 0.6.x non
  noteranno cambiamenti runtime su `<lnk-spinner>`. Possono
  eventualmente rimuovere `MatProgressSpinnerModule` dal loro
  bundle se non lo usano per altro.

---

## [0.6.0] — 2026-05-31

Generalizzazione G2 dell'analisi
[`ANALISI-MINI-LIB-DATA-TABLE.md`](../../../CLAUDE-NOTE/ANALISI-MINI-LIB-DATA-TABLE.md):
introduzione di un tooltip "lnk" basato su CDK Overlay come alternativa
portable a `MatTooltipModule`, e migrazione di tutti i componenti lib
ai nuovi binding.

### Aggiunto

- **`LnkTooltipDirective`** (`[lnkTooltip]`) — directive basata su
  `@angular/cdk/overlay`. Stessa accessibilità di `MatTooltip`
  (`aria-describedby` auto, ruolo `tooltip`, supporto Escape) ma
  dipendenza solo da `@angular/cdk` (no `@angular/material`). API:
  - `[lnkTooltip]` — testo (string | null | undefined). Se vuoto la
    directive resta inerte.
  - `lnkTooltipPosition` (`'above'` | `'below'` | `'left'` |
    `'right'`, default `'above'`) — posizione preferita con flip
    automatico se non c'è spazio.
  - `lnkTooltipDelay` (number ms, default 300) — delay show su
    mouseenter / focus.
  - `lnkTooltipVariant` (`'default'` | `'info'` | `'warning'` |
    `'custom'`) — colori del tooltip.
  - `lnkTooltipClass` — classi Tailwind aggiuntive quando
    `variant === 'custom'`.
  - `lnkTooltipDisabled` (boolean) — disattiva la directive (utile
    per nasconderlo in stati specifici tipo dropdown aperto).
- **`LnkTooltipComponent`** (`<lnk-tooltip>`) — componente puro di
  rendering, istanziato dalla directive tramite `ComponentPortal`.
  Non si usa direttamente nei template del consumer.
- Esportazione di entrambi da `@linkit/shared-ui` via barrel
  `core/ui/index.ts`.

### Animazione

- Effetto "pop": fade in + scale 95% → 100% con `ease-out` e
  `duration-150`. `origin-center` ancora la transizione al centro.
- `transition-[opacity,transform]` (anziché `transition-all`) evita
  il flicker di resize che si verificava al primo frame di
  posizionamento del CDK Overlay quando l'animazione coinvolgeva
  anche `max-width`/`padding`.
- `requestAnimationFrame` invece di `queueMicrotask` per garantire
  che il browser esegua layout + paint dello stato iniziale prima
  di flippare a `visible=true`.
- `will-change-[opacity,transform]` per promuovere l'elemento al
  compositor.

### Modificato

Migrati a `LnkTooltipDirective` tutti gli usi interni di
`MatTooltipModule` nella libreria. Cambio retrocompatibile sul piano
runtime ma il **tipo dell'input `tooltipPosition`** dei seguenti
componenti passa da `TooltipPosition` (Material, 6 valori) a
`LnkTooltipPosition` (4 valori: `'above' | 'below' | 'left' | 'right'`).
I valori `'before'`/`'after'` di Material non sono più accettati.

- `<lnk-color-scheme-toggle>` (header + sidebar variants).
- `<lnk-language-menu>`.
- `<lnk-tweaks-panel>` (pulsante flottante).
- `<lnk-goto-top>` (FAB torna su).
- `<lnk-item-type>` (renderer celle data-table + item-row): 12
  occorrenze nei template, sostituite con i binding `[lnkTooltip*]`.
- `<lnk-item-row>`: rimosso `MatTooltipModule` dagli `imports[]`
  (era importato ma non usato nel template).

### Note di consumer-side

- I consumer di `govpay-console` (`profile-menu`, `sidebar-item`)
  sono stati migrati allo stesso pattern come reference
  applicativa (vedi commit del consumer).
- `@angular/material` resta peer dependency **obbligatoria** della
  lib finché lo `<lnk-spinner>` non sarà migrato da
  `MatProgressSpinnerModule` (prossima minor).
- Lo `matTooltipShowDelay="300"` esplicito nei template è stato
  rimosso perché 300ms è già il default di `lnkTooltipDelay`.

---

## [0.5.2] — 2026-05-30

### Risolto

- **`<lnk-item-row>`** — avatar slot senza padding verticale: quando
  il content area (primaryText + metadata) è basso quanto il logo
  avatar (es. row con solo primaryText + secondaryText, senza
  `metadata`), il logo `app-logo`/`avatar-image` di 48×48 occupava
  l'intera altezza della row e toccava i bordi superiore/inferiore
  (`border-b`). Visivamente "schiacciato" alla riga.

  Fix: aggiunto `py-2` (16 px verticale totali) al wrapper avatar.
  La row ora ha sempre almeno 64 px di altezza quando c'è l'avatar
  e il logo resta centrato con padding visibile sopra/sotto.

  Retrocompatibile: le row con metadata multi-line (più alte di
  64 px) non cambiano — `items-center` continua a centrare l'avatar
  rispetto al content.

---

## [0.5.1] — 2026-05-30

### Risolto

- **`<lnk-item-type>` `'app-logo'`** — sotto-tipi `bootstrap` e
  `material` non rendevano l'icona. Causa: i value object del data
  row contengono il nome icona "corto" (es. `'mortarboard'`,
  `'school'`), mentre `@ng-icons/bootstrap-icons` e
  `@ng-icons/material-icons` registrano le icone con nomi prefissati
  CamelCase (`'bootstrapMortarboard'`, `'matSchool'`). Il binding
  `<ng-icon [name]="raw">` non trovava nessuna icona registrata e
  renderizzava un tag vuoto.

  Fix: i computed `appLogoIcon` / `appLogoMicon` ora normalizzano
  il nome — prefisso + CamelCase (con gestione di trattini e
  underscore: `'person-fill'` → `'bootstrapPersonFill'`,
  `'shopping_cart'` → `'matShoppingCart'`). Nomi già prefissati
  (`'bootstrapMortarboard'`) passano invariati.

  Inoltre: il sotto-tipo `material` ora usa `<ng-icon>` con
  `@ng-icons/material-icons` invece del font CSS legacy
  `<span class="material-icons">` — coerente con `bootstrap` e non
  richiede il caricamento del font Material Icons nel consumer
  (richiede solo `provideIcons({ ...materialIcons })`).

  Retrocompatibile.

---

## [0.5.0] — 2026-05-30

### Aggiunto

- **`<lnk-item-type>` — nuovo tipo `'app-logo'`**. Rende un logo
  "ricco" per la rappresentazione di un'applicazione, con 4
  sotto-tipi gestiti automaticamente in base al valore del campo
  (case-insensitive):

  - `bootstrap` → icona `<ng-icon>` (`icon`) col colore configurato.
  - `material` → glyph `material-icons` (`micon`) col colore configurato.
  - `image` → `<img>` raster da `url`.
  - `svg` → `<img>` SVG da `icon_url`.

  Shape atteso del valore (puntato da `elem.field`, tipicamente
  `'app_metadata.logo'`):

  ```jsonc
  {
    "type": "bootstrap" | "material" | "image" | "svg",
    "icon": "...",           // type=bootstrap
    "micon": "...",          // type=material
    "url": "...",            // type=image
    "icon_url": "...",       // type=svg
    "bg_color": "#83B5D1",   // colore container, default Link.it accent
    "color": "#ffffff"       // colore icona/testo
  }
  ```

  `elem.alt` punta al campo testuale del data row per le **iniziali
  fallback** (es. `display_name` → "AB") quando il valore non
  matcha nessuno dei 4 sotto-tipi o quando il sotto-asset
  (`icon`/`url`/...) è vuoto.

  `elem.square` controlla il border-radius del container
  (`rounded-sm` se true, `rounded-full` altrimenti).

  Estratto dal componente legacy `<ui-item-type>` di
  `govregistry-app-v2` (feature `applications`). Riusabile da tutte
  le app GovDesk con feature applications/registry (govhub-app-v2,
  ecc.).

  Esempio di display config:

  ```json
  {
    "itemRow": {
      "avatar": {
        "field": "app_metadata.logo",
        "type": "app-logo",
        "alt": "display_name",
        "square": true
      }
    }
  }
  ```

  Retrocompatibile: nessun impatto sui config esistenti che non
  usano `type: "app-logo"`.

---

## [0.4.1] — 2026-05-29

### Risolto

- **`<lnk-info-grid>`** — `uppercaseLabels` non veniva
  effettivamente applicato a runtime. Causa: il template combinava
  tre forme di class binding sullo stesso `<dt>` —
  `class="..."` (statica), `[class]="labelSizeClass()"` (stringa
  dinamica) e `[class.uppercase]="..." / [class.tracking-wider]="..."`
  (toggle singolo). Quando `[class]` veniva aggiornato in change
  detection, Angular azzerava i toggle singoli adiacenti.

  Fix: unificate tutte le classi (base + size + caps opzionale) in
  un singolo `[class]="labelClass()"` con un `computed` che produce
  la stringa completa. Stessa rifattorizzazione su `<dd>` con
  `valueClass(item)` che rispetta anche la priorità `mono > size`.

---

## [0.4.0] — 2026-05-29

### Aggiunto

- **`<lnk-info-grid>`** — nuovo input booleano `uppercaseLabels`
  (default `false`). Quando attivo applica `uppercase` +
  `tracking-wider` al `<dt>` (label), replicando il pattern
  "caps box" tipico Link.it (es. vecchio blocco "Informazioni
  report" di govaudit). Usa `booleanAttribute` come transform:
  accetta `uppercaseLabels`, `uppercaseLabels="true"`,
  `[uppercaseLabels]="true"`.

  Retrocompatibile: default `false` mantiene il rendering
  mixed-case storico.

---

## [0.3.0] — 2026-05-29

### Aggiunto

- **`<lnk-info-grid>`** — nuovo input `size` per scegliere la
  dimensione del testo:
  - `sm` (default, comportamento storico) → value `text-sm`,
    label `text-xs`.
  - `md` → value `text-base`, label `text-sm`.
  - `lg` → value `text-lg`, label `text-base`.
  - Stringa custom `'<value>|<label>'` (es. `'text-2xl|text-base'`)
    per coppie fuori scala.

  Default `sm` garantisce piena retrocompatibilità: tutti gli usi
  esistenti (dettagli pendenze, dossier, file-detail, report-detail
  in govaudit) non richiedono modifiche.

  L'override `mono` ha precedenza sul `size`: i campi monospace
  (IUV/ID/codici) restano sempre `text-xs` indipendentemente dalla
  size scelta per il resto della grid.

---

## [0.2.0] — 2026-05-29

Modifiche emerse durante l'integrazione della libreria in `govaudit`
(prima app GovDesk consumer dopo `govpay-console`). Vedi
`[GOVDESK-V2]/NOTE-CLAUDE/LNK-SHARED-UI-INTEGRATION/CHANGELOG.md`
per il contesto completo.

### Aggiunto

- **`<lnk-back-button>`** — pulsante "Indietro" riusabile con
  `Location.back()` di default, override opzionale via input
  `targetRoute` (naviga via Router), input
  `labelKey`/`iconName`/`size` (`sm` | `md` | `lg`) e output `back`
  con `preventDefault()` per intercettare il click dal consumer.
- **`<lnk-empty-state>`** — input `image` (URL/path SVG/PNG come
  alternativa all'icona, ha priorità su `icon`) e input `size`
  (`sm` | `md` | `lg` | `xl` o stringa CSS arbitraria) per
  dimensionare container icona + pillola + image.
- **`<lnk-page-header>`** — input `titleSize` per scegliere la
  dimensione del titolo: preset (`sm` | `md` | `lg` | `xl` | `2xl`,
  default `xl` = `text-2xl` invariato) o stringa Tailwind arbitraria
  (es. `'text-4xl'`, `'text-[28px]'`).
- **`<lnk-item-type>`** — binding `[matTooltip]` ora applicato anche
  ai case `image` e `avatar-image` (prima erano gli unici tipi senza
  tooltip). Permette al display config di passare `tooltip:
  '<campo>'` su un avatar e mostrare in hover il nome/username.
- **`styles/index.css`** — foglio CSS della libreria, ora
  importabile dal consumer con una sola riga
  (`@import "../../lnk-shared-ui/src/styles/index.css"`). Contiene:
  - CSS variables del tema (default branding Link.it) in `:root`
    (`--card-bg`, `--card-border`, `--header-height`,
    `--status-*-{bg,text}`, ecc.) — sovrascrivibili dal consumer
    via cascade.
  - Scope `lnk-*` per le 8 variabili conflittuali con il sistema
    shadcn-HSL del consumer (`--primary`, `--foreground`, `--muted`,
    ecc.) ridefinite con hex direct nel sub-tree dei soli componenti
    lib. Le app shadcn-based mantengono il loro theming senza
    rompere le arbitrary Tailwind utilities (`bg-[var(--card-bg)]`,
    `text-[var(--muted-foreground)]`) interne ai componenti lib.
  - Utility classes `.lnk-sep` / `.lnk-no-sep` (separatore `·`
    inline), `.lnk-list-page` / `.lnk-detail-page` (page wrapper
    centrato), `.lnk-link-hover` (colore primary in hover/focus
    su link), `.lnk-row-hover` (sfondo `--card-hover` in hover row),
    `.lnk-toolbar-stuck` (ombra toolbar sticky),
    `.lnk-header--scrolled` (backdrop blur header).
  - Utility classes `.btn` / `.btn-primary` / `.btn-secondary` /
    `.btn-ghost` / `.btn-sm` / `.btn-icon` / `.btn-block`
    consumano `--lnk-btn-{primary,secondary}-*` (namespace
    isolato dal sistema theming Bootstrap-style che alcuni consumer
    possono avere già su `--btn-*` con semantica diversa).
  - `color: var(--foreground)` di default sui container "alto
    livello" (`lnk-data-table`, `lnk-item-row`, `lnk-empty-state`,
    ecc., esclusi `lnk-item-type`/`lnk-item-list` per non bloccare
    inheritance hover Tailwind). Evita che il `body { color: ... }`
    del consumer (es. govaudit con `var(--link-color)` = `#212121`)
    venga ereditato dai testi della lib.
  - `.scrollbar-thin` per scrollbar custom.

### Note di integrazione

- I componenti consumer che usano `<lnk-data-table>` /
  `<lnk-item-list>` / `<lnk-item-row>` / `<lnk-empty-state>` /
  `<lnk-loading>` / `<lnk-page-header>` con i parametri pre-esistenti
  continuano a funzionare invariati (le novità sono additive con
  default coerenti col comportamento precedente).
- Il consumer che vuole usare `<lnk-back-button>` non ha bisogno di
  registrare provider extra: `Location` è in `@angular/common`,
  `Router` è già fornito dal `provideRouter()` del bootstrap.

---

## [0.1.0] — 2026-05-26

Prima release della libreria estratta da `govpay-console` (Fase 7 del
piano `PIANO-LAVORO.md` / step 1-8+10 di
`PIANO-LNK-SHARED-UI.md`).

### Aggiunto

- **utils**: `format` (formatDate, formatDateTime, formatNumber,
  daysAgoIso, ecc.), `display-options` (getBoxOptionStyle, palette
  helpers), `sort` (formatOrdinamento), `list-tweaks-options`
  (VIEW_OPTIONS, DATE_RANGE_OPTIONS, matchDateRangePreset).
- **directives**: `lnkInfiniteScroll`, `lnkListStickyToolbar`.
- **components** (15): `lnk-data-table` con `ColumnDef<T>` +
  `cell: ItemTypeElement` opzionale, `lnk-item-list`/`lnk-item-row`/
  `lnk-item-type` driven-by-config, `lnk-pagination`, `lnk-page-header`,
  `lnk-detail-section`, `lnk-info-grid`, `lnk-tabs`, `lnk-empty-state`,
  `lnk-loading`, `lnk-status-badge`, `lnk-search-input`,
  `lnk-select-input`, `lnk-date-input`.
- **core/system**: `SystemFacade` (sidebar, mobile menu, breadcrumbs,
  loading, help sidebar, color scheme), `ListStateService`,
  `LayoutOverridesService`.
- **core/config**: `ConfigService`, `ThemeLoaderService` (light/dark +
  `prefers-color-scheme`), tipi `AppConfig`, `BrandingConfig`,
  `LayoutConfig`, `AuthMode`, `ControlPosition`, `ExtraMenuItem`.
- **core/i18n**: `LanguageService` (wrapper signal-based di
  `TranslateService` con persistenza `lnk-locale`).
- **core/ui**: `lnk-snackbar` + `SnackbarService`, `lnk-goto-top`,
  `lnk-spinner`, `lnk-placeholder`, `lnk-color-scheme-toggle`,
  `lnk-language-menu`, pannello `tweaks/` (`TweaksRegistry`,
  `GlobalTweaksHostComponent`, building blocks
  `tweak-toggle/segmented/row/section`, `tweaks-panel`).
- **core/layout**: `lnk-help-sidebar`, `lnk-maintenance`.
- **i18n**: `i18n/{it,en}.json` con 14 namespace generici (App, Common,
  Pagination, Tweaks, Auth, Layout, Profile, Theme, Language, Snackbar,
  Help, Maintenance, About, Placeholder).

### Astrazioni introdotte

- **`BREADCRUMB_ICON_RESOLVER`** (`InjectionToken<(label: string) =>
  string | undefined>`): permette a `SystemFacade.setBreadcrumbs` di
  arricchire automaticamente i breadcrumb con icone senza importare
  `NAV_ITEMS` del consumer (dominio). Il consumer registra il resolver
  in `app.config.ts`. Se non provisto, `setBreadcrumbs` non aggiunge
  icone.

### Decisioni di scope (non incluse)

Le seguenti aree restano nel consumer perche` accoppiate al dominio o
al backend specifico:

- `core/auth/*` (strategie Basic/SPID/IAM/OAuth2 + `AuthAcl` +
  `SERVIZIO_ACL`).
- `core/services/api.service.ts` (`URL_BY_TIPO` GovPay-specifico).
- `core/interceptors/*` (auth + error).
- `core/layout/{main-layout, sidebar, sidebar-mobile, header-bar,
  mobile-bottom-nav, nav.ts, icons.config.ts}` (deps `AuthService` o
  `NAV_ITEMS` di dominio). `help-sidebar` e `maintenance` sono in lib.
- `core/ui/profile-menu/` (deps `AuthService`).

### Peer dependencies

- `@angular/animations ^21.0.0`
- `@angular/cdk ^21.0.0`
- `@angular/common ^21.0.0`
- `@angular/core ^21.0.0`
- `@angular/forms ^21.0.0`
- `@angular/material ^21.0.0`
- `@angular/router ^21.0.0`
- `@ng-icons/bootstrap-icons ^33.0.0`
- `@ng-icons/core ^33.0.0`
- `@ngx-translate/core ^17.0.0`
- `rxjs ~7.8.0`
