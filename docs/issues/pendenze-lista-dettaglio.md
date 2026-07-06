## 🎯 Obiettivo

Sezione **Pendenze** della Console GovPay v2: **lista** e **dettaglio** (con voci e sub-resources avviso/ricevuta/informazioniDebitore). Questa epica allinea il frontend al **contratto API V2 deciso in `govpay-console-api#61`** (consultazione read-only Fase 1) e traccia ciò che è già implementato (oggi su API V1) e cosa va adeguato.

> **Dipendenza**: `govpay-console-api#61` — _Consultazione pendenze: lista, dettaglio, sub-resources_. Il contratto V2 (naming, enum, filtri, paginazione, HAL `_links`) è definito lì. Questa issue ne segue le decisioni.

## ✅ Stato attuale (già implementato, su API V1)

### Lista
- [x] Tabella config-driven (`pendenze-config.json`): numero avviso/IUV, tipo, pagatore, causale, data caricamento, importo, stato (badge colore)
- [x] Filtri: ricerca (numero avviso/IUV), stato, data da/a; ordinamento su `dataCaricamento`/`importo`
- [x] Infinite scroll (25/pagina) con totale risultati; view mode tabella/righe + preset date; persistenza stato al ritorno dal dettaglio

### Dettaglio
- [x] Route canonica `/pendenze/:idA2A/:idPendenza` (+ accesso `byAvviso/:idDominio/:numeroAvviso`)
- [x] Tab **Dati**: informazioni generali, ente creditore (EC), soggetto pagatore, ricevute (link)
- [x] Tab **Eventi** (giornale eventi): infinite scroll, badge conteggio, drilldown
- [x] Breadcrumb + back con ripristino stato lista

### Trasversale
- [x] Lazy route con ACL guard (`hasPendenze` / `hasPagamentiePendenze`); modelli + i18n + error handling

## 🔄 Adeguamento al contratto V2 (`govpay-console-api#61`)

### Naming, enum, paginazione
- [ ] **Stati pendenza** → enum V2: `NON_PAGATA | PAGATA | PAGATA_PARZIALE | ANNULLATA | SCADUTA | RICONCILIATA | ANOMALA` (rimpiazza i nomi V1 `ESEGUITA/NON_ESEGUITA/INCASSATA/…`); aggiornare badge/colori e i18n
- [ ] **Parametri tecnici in inglese**: `page`, `limit` (default 25, **max 200**), `sort` (default `-dataUltimoAggiornamento`), `total` (default `false`) — sostituiscono `pagina`/`risPerPagina`/`ordinamento`
- [ ] **`PaginatedResponse`**: gestire **Slice di default** (nessun conteggio totale se non si passa `total=true`) — l'infinite scroll non può assumere `numRisultati`/`numPagine`
- [ ] **Cursor pagination** opt-in (`cursor`, mutuamente esclusivo con `page`): valutare se adottarla per l'infinite scroll (usa `nextCursor`)

### Lista
- [ ] **Solo 4 filtri in Fase 1**: `idPendenza`, `numeroAvviso`, `idDominio`, `identificativoDebitore`. ⚠️ I filtri attuali **stato** e **data da/a** **non sono supportati** → la API risponde **400**: rimuoverli dalla toolbar (o nasconderli) finché non arriva la Fase 2 API
- [ ] **Colonna pagatore**: in `PendenzaSummary` c'è solo `idDebitore` (CF/PIVA), **non** l'anagrafica → mostrare il CF/PIVA (o rimuovere la colonna nome) in lista
- [ ] Allineare colonne ai campi `PendenzaSummary` V2 (`causaleBreve` max 80, `importoPagato`, `dataUltimoAggiornamento`, `anomalo`, `verificato`, `numeroAvviso`, `iuvAvviso`, ref `dominio`/`tipoPendenza`/`unitaOperativa`)
- [ ] **Ricerca per `identificativoDebitore`**: nota che lato API genera **audit GDPR**; valutare UX (campo dedicato vs ricerca generica)

### Dettaglio
- [ ] **`soggettoPagatore` non è più nel body**: la sezione "Soggetto pagatore" va popolata con una chiamata separata alla sub-resource **`/informazioniDebitore`** (vedi sotto), seguendo `_links.informazioniDebitore`
- [ ] **`voci` inline** (max 5, sempre presenti): aggiungere sezione "Voci" nel dettaglio (campi `indice`, `descrizione`, `importo`, `stato` con enum `StatoVocePendenza` = `NON_PAGATA|PAGATA|ANOMALA`)
- [ ] Navigazione sub-resources **guidata da `_links`** (HAL): mostrare azioni solo se il link è presente (`avviso`/`ricevuta` condizionali)
- [ ] **`?expand=datiAllegati,proprieta`**: gestire i sub-tree opt-in quando servono
- [ ] **`byAvviso` resta su API V1** nel transitorio (il lookup V2 `/pendenze/avviso/{idDominio}/{numeroAvviso}` è fuori scope Fase 1): mantenere il path attuale verso V1 finché non migra

### Nuove sub-resources (HAL `_links`)
- [ ] **`/avviso`** — visualizzazione avviso (JSON metadati) e **stampa avviso PDF** (`Accept: application/pdf`, via microservizio `govpay-stampe`); supporto `linguaSecondaria` per province bilingui → _abilita il gap "stampa avviso"_
- [ ] **`/ricevuta`** — ricevuta telematica in **JSON / XML / PDF** (RT principale = ultima riuscita); sostituisce l'attuale link esterno a `/ricevute/{idDominio}/{iuv}`
- [ ] **`/informazioniDebitore`** — oggetto `Soggetto` completo (anagrafica, contatti); ogni apertura traccia **audit GDPR** lato API: caricare on-demand, non automaticamente

## 🚧 Gap evolutivi (fasi successive / dipendenti da API)

- [ ] **Pagamenti collegati (RPP/RT)** nel dettaglio → dipende dalla _fase Pagamenti_ delle API (`/rpp`, `/pagamenti` fuori scope #61)
- [ ] **Allegati** (metadati + download) → fuori scope API Fase 1
- [ ] **CRUD pendenze** (crea / modifica / annulla) → le scritture (`POST/PUT/PATCH`) sono fuori scope API Fase 1
- [ ] **Tracciati** pendenze (import/export massivo) → fuori scope API Fase 1
- [ ] **Filtri estesi** (stato, tipo, date, iuv, ecc.) → attesa Fase 2 API
- [ ] **Esportazione** risultati lista (CSV/Excel)
- [ ] Copertura **test** (unit/e2e) su lista, filtri, dettaglio e sub-resources

## ✔️ Criteri di accettazione

- La lista usa i parametri V2 (`page`/`limit`/`sort`/`total`) e i **soli 4 filtri** supportati, senza inviare filtri che produrrebbero 400
- Gli stati pendenza usano l'enum V2 (badge/colori/i18n aggiornati)
- Il dettaglio mostra le **voci inline** e carica anagrafica debitore **solo** via `/informazioniDebitore` (on-demand)
- Avviso e ricevuta sono accessibili nei formati previsti (JSON/PDF, e XML per la ricevuta) seguendo gli `_links`
- Le azioni sub-resource compaiono solo quando il relativo `_link` è presente
- I gap dipendenti da fasi API successive sono tracciati in issue collegate

## 📎 Riferimenti tecnici

- API: `govpay-console-api#61` (`docs/issues/61-pendenze-consultazione.md`) — contratto V2, enum, filtri, `_links`, sub-resources
- Frontend: `app/features/pendenze/` — `pendenze-list.component`, `pendenza-detail.component`, `pendenze.api.ts`, `pendenza.model.ts`, `pendenze.routes.ts`
- Config: `assets/config/pendenze-config.json`, label in `assets/i18n/it.json`
- Endpoint V2: `GET /pendenze` (lista), `GET /pendenze/{idA2A}/{idPendenza}` (dettaglio, voci inline), `GET .../avviso`, `GET .../ricevuta`, `GET .../informazioniDebitore`
- Mapping enum V1→V2 da gestire: `ESEGUITA→PAGATA`, `NON_ESEGUITA→NON_PAGATA`, `ESEGUITA_PARZIALE→PAGATA_PARZIALE`, `INCASSATA→RICONCILIATA`
