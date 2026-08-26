## 🎯 Obiettivo

Gestione completa di **autenticazione, login e profilo utente** della Console GovPay v2: accesso multi-modalità, sessione, e visualizzazione del profilo con EC associati, tipi pendenza associati e ACL disponibili. Questa epica traccia ciò che è già implementato e i gap evolutivi da completare.

## ✅ Stato attuale (già implementato)

- [x] Auth service signal-based con persistenza (`localStorage` chiave `lnk-auth`) e rehydration via `GET /profilo`
- [x] Login multi-modalità: **Basic** (user/password), **SPID**, **IAM**, **OAuth2** (redirect) + mock login in dev
- [x] Interceptor `Authorization` su tutte le richieste
- [x] Guard di autenticazione (`authGuard`) e guard ACL parametrico (`aclGuard(...)`)
- [x] Logout dedicato (componente + API) con clear sessione e redirect
- [x] Modelli `AuthUser` / `ProfiloResponse` + mapping ACL → flag booleane (`canWrite`, ecc.)
- [x] Pagina `/profilo`: anagrafica + **EC (Enti Creditori) associati**, **tipi pendenza associati**, **ACL disponibili** (R/W per servizio)
- [x] Menu e routing condizionati da ACL + feature flag (`filterNav`)

## 🚧 Gap evolutivi (da completare)

- [ ] **Cambio password** in-app (per utenze Basic)
- [ ] **Recupero / reset password**
- [ ] **Gestione token OAuth2**: refresh automatico e scadenza esplicita
- [ ] **Sessione scaduta**: rilevamento 401, messaggio dedicato e redirect pulito al login
- [ ] **Feedback di login**: stati di errore differenziati (credenziali errate, utente non abilitato, backend down)
- [ ] **Hardening**: valutare storage credenziali Basic (oggi in `localStorage`) e relativi rischi
- [ ] Autorizzazione **a livello di componente/azione** (oltre a route e menu)
- [ ] Copertura **test** (unit/e2e) su login, guard e rehydration

## ✔️ Criteri di accettazione

- L'utente accede con tutte le modalità supportate e la sessione persiste al refresh
- Alla scadenza/invalidazione sessione, l'utente è reindirizzato al login con messaggio chiaro
- La pagina profilo riflette fedelmente **EC associati, tipi pendenza associati e ACL disponibili** restituiti da `/profilo`
- Menu e rotte mostrano solo ciò consentito dalle ACL dell'utente
- I gap sopra sono coperti da issue collegate e da test

## 📎 Riferimenti tecnici

- `app/core/auth/` — service, api, guards, models
- `app/features/auth/logout/`, `app/features/profilo/`
- `app/core/layout/nav.ts` (`filterNav`), `app/app.routes.ts`
- Endpoint backend: `GET /profilo` → EC associati (campo `domini`), tipi pendenza associati (`tipiPendenza`), ACL disponibili (`acl`)
