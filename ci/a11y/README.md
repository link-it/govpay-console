# Verifica accessibilità (gov-a11y) — GovPay Console

Questa cartella contiene **solo la configurazione** dell'audit di accessibilità di GovPay
Console. Lo scanner è il tool esterno **[`gov-a11y`](https://github.com/link-it/gov-a11y)**
(axe-core + Playwright, screen reader e Lighthouse opzionali): **nessuna dipendenza a11y viene
aggiunta a questo repo**. Il tool legge `ci/a11y/targets.json` via `--config`.

- `targets.json` — viste, navigazione e strategia di login di GovPay Console. **Niente
  credenziali qui** (auth a form: le credenziali arrivano da variabili d'ambiente / secret CI).

## Esecuzione in locale

Con l'app avviata (dev server su `http://localhost:4200`):

```bash
# 1) una volta: procurati il tool a fianco del repo
git clone --depth 1 https://github.com/link-it/gov-a11y /tmp/gov-a11y
( cd /tmp/gov-a11y && npm ci )     # installa Playwright/Chromium + deps opzionali

# 2) lancia l'audit puntando alla config di QUESTO repo
A11Y_GOVPAYCONSOLE_USER='gpadmin' A11Y_GOVPAYCONSOLE_PASS='...' \
node /tmp/gov-a11y/a11y-scan.mjs \
  --base http://localhost:4200 \
  --config "$PWD/ci/a11y/targets.json" \
  --out   "$PWD/a11y-report" \
  --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa \
  --fail-on serious --fail-on-nameless --screen-reader
```

Report in `a11y-report/` (`report.html`, `summary.json`, `a11y.sarif`, `sonar-issues.json`,
`a11y-junit.xml`, `axe-results.json`, `aria-tree/`). Exit-code ≠ 0 se il gate non è rispettato.

> Le credenziali NON vanno mai nel `targets.json` né committate. In locale passale inline (env),
> in CI usa i secret. Chiave = nome del target in MAIUSCOLO: `A11Y_GOVPAYCONSOLE_USER/PASS`.

## Esecuzione in CI (GitHub Actions)

Copia `ci/a11y/a11y.yml` in `.github/workflows/a11y.yml` e adatta lo step di avvio dell'app.
Usa la reusable action `link-it/gov-a11y@v1`; imposta i secret repo `A11Y_GOVPAYCONSOLE_USER`
e `A11Y_GOVPAYCONSOLE_PASS`.

## Note

- **Flows**: la config include i flows di dettaglio/modifica (via `lnk-item-list`/`lnk-item-row`);
  su ambienti senza dati vengono saltati automaticamente (`skipIfMissing`).
- **Lighthouse** (`--lighthouse`) è opzionale (richiede più tempo); aggiunge il punteggio a11y 0–100.
- **`--no-incomplete`**: nasconde la colonna/sezione "Da verificare" (incomplete axe) dal
  `report.html` (i dati restano in `summary.json`/`axe-results.json`). In CI: `no-incomplete: 'true'`.
- Aggiorna `targets.json` solo se cambiano rotte, selettori o strategia di login.
