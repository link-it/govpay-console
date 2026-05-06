/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

/**
 * Modelli di configurazione runtime dell'applicazione.
 *
 * Caricati da:
 *   - `assets/config/app-config*.json` → configurazione applicativa (auth, layout, features)
 *   - `assets/config/theme.json` → branding + tema (logo, colori, font)
 *
 * La separazione segue lo stile di `govpay-portal`. La voci di navigazione (sidebar)
 * NON sono qui ma in `core/layout/nav.ts` (codice).
 */

export type AuthMode = 'Basic' | 'Spid' | 'Iam' | 'OAuth2';

/**
 * Schema cromatico applicato al `<html>`:
 *   - `light` / `dark`: forzato dall'utente
 *   - `auto`: segue `prefers-color-scheme` del sistema
 */
export type ColorScheme = 'light' | 'dark' | 'auto';
/** Schema risolto al momento del rendering (auto → light|dark). */
export type ResolvedColorScheme = 'light' | 'dark';

export interface AppInfo {
  name: string;
  title: string;
  subtitle?: string;
  description?: string;
  // Nota: la versione applicativa è in `@environments/version.ts`
  // (`VERSION.version`), generata da `scripts/generate-version.js` a
  // build-time leggendo `package.json`. Non duplicare qui.
}

export interface GovApiConfig {
  GOVPAY: string;
  GOVHUB?: string;
}

export interface AuthEndpointsConfig {
  login?: string;
  logout?: string;
  spid?: string;
  oauth2?: string;
  iam?: string;
}

export interface AuthConfig {
  Modes: AuthMode[];
  Default: AuthMode;
  Endpoints: AuthEndpointsConfig;
}

/**
 * Posizione di un control opzionale (toggle tema, selettore lingua, ...) nel layout.
 *   - `'header'`  → nell'header bar (a destra prima del profilo)
 *   - `'sidebar'` → nel footer sidebar (allineato a destra)
 *   - `'none'`    → nascosto
 */
export type ControlPosition = 'header' | 'sidebar' | 'none';

/** Una lingua disponibile nell'applicazione. */
export interface Language {
  /** Codice ISO 639-1 (it, en, ...). Usato come key i18n e `lang` di `<html>`. */
  code: string;
  /** Etichetta estesa (es. 'Italiano', 'English'). */
  label: string;
  /** Sigla breve mostrata accanto all'icona (es. 'IT', 'EN'). Default: `code.toUpperCase()`. */
  short?: string;
  /** Emoji bandiera opzionale (es. '🇮🇹'). */
  flag?: string;
}

/**
 * Voce di menu aggiuntiva, configurabile da `app-config.json` per il
 * profile menu o il footer della sidebar (stile GovHub).
 *
 *   ```json
 *   {
 *     "labelKey": "Profile.MenuItems.UserGuide",
 *     "icon": "bootstrapQuestionCircle",
 *     "link": "https://lab.link.it/documentazione/govpay/",
 *     "target": "_blank"
 *   }
 *   ```
 *
 * - `link` può essere un URL esterno (`https://…`) o una rotta interna
 *   (`/about`); il rendering decide automaticamente fra `<a href>` e
 *   `routerLink` in base al prefisso (`http`/`https` → esterno).
 * - `target='_blank'` apre in nuova finestra; aggiunge automaticamente
 *   `rel="noopener noreferrer"` per sicurezza.
 * - `icon` è un nome ng-icon **già registrato** in
 *   `core/layout/icons.config.ts` (es. `bootstrapQuestionCircle`).
 */
export interface ExtraMenuItem {
  /** Chiave i18n della label. */
  labelKey: string;
  /** Nome icona ng-icon registrata. Opzionale. */
  icon?: string;
  /** URL esterno o rotta interna. */
  link: string;
  /** Target del link (default `'_self'` per interni, `'_blank'` per esterni). */
  target?: '_self' | '_blank';
}

export interface LayoutConfig {
  showHeaderBar: boolean;
  showFooterBar: boolean;
  /**
   * Posizione del menu profilo:
   *   - `'header'`  → nell'header bar (default GovPay)
   *   - `'sidebar'` → nel footer sidebar (stile GovHub)
   *   - `'none'`    → nascosto (utile in app embedded o pagine pubbliche senza login)
   */
  profileMenuPosition: ControlPosition;
  /** Posizione del toggle dark mode. Default: `'header'`. */
  darkModeTogglePosition?: ControlPosition;
  /** Posizione del selettore lingua. Default: `'header'`. */
  languageSelectorPosition?: ControlPosition;
  /** Lingue disponibili. Se assente, default `[{code:'it',label:'Italiano'},{code:'en',label:'English'}]`. */
  languages?: Language[];
  /** Lingua di default all'avvio (deve essere presente in `languages`). Default: `'it'`. */
  defaultLanguage?: string;
  /** Mostra la voce About nel profile menu (default `true`). */
  showAbout?: boolean;
  /** Mostra la versione in fondo alla sidebar (default `true`). */
  showVersion?: boolean;
  /**
   * Mostra l'hash di build (git short SHA) accanto al numero di versione
   * — es. `v4.0.0 · ccd745b`. Default `false` (mostra solo `v<version>`).
   */
  showBuild?: boolean;
  /**
   * Voci aggiuntive nel profile menu, inserite tra la voce "About" e
   * il logout. Stile GovHub. Vedi `ExtraMenuItem`.
   */
  profileMenuExtraItems?: ExtraMenuItem[];
  /**
   * Voci aggiuntive renderizzate nel footer della sidebar (sopra alla
   * versione), una per riga. Visibili solo a sidebar espansa. Pensate
   * per link a documentazione, supporto, dashboard correlate.
   */
  sidebarFooterItems?: ExtraMenuItem[];
  footerHeight?: string;
  /**
   * Modalità di rendering delle liste:
   *   - `'table'` (default) → `<lnk-data-table>` con colonne tabellari
   *   - `'rows'`            → `<lnk-item-list>` con righe driven-by-config
   * Impostabile globalmente qui, oppure overridato per singola feature
   * via `listViewByFeature`.
   */
  listView?: 'table' | 'rows';
  /** Override della `listView` per feature (chiave = nome feature, es. `pendenze`). */
  listViewByFeature?: Record<string, 'table' | 'rows'>;
  /**
   * Mostra il pulsante flottante "torna su" (bottom-right) quando la
   * pagina è scrollata oltre la soglia. Default: `true`.
   */
  gotoTopButton?: boolean;
  /**
   * Mostra il pulsante "Aiuto" nell'header bar (apre la sidebar
   * di help contestuale). Default: `true`.
   */
  helpButton?: boolean;
  /**
   * Mostra il FAB del pannello `<lnk-tweaks-panel>` nelle feature che
   * lo integrano (es. liste con preset di personalizzazione). Default
   * `true`. Impostare `false` per nascondere globalmente lo strumento
   * di tweak senza modificare le singole feature.
   */
  tweaksPanel?: boolean;
  /**
   * Larghezza massima del container delle pagine lista (es. `'80rem'`,
   * `'1280px'`). Applicato come CSS variable `--lnk-list-max-w` su
   * `<html>`. Default: `'none'` (full-width).
   */
  listMaxWidth?: string;
  /**
   * Larghezza massima del container delle pagine dettaglio. Applicato
   * come CSS variable `--lnk-detail-max-w` su `<html>`. Default: `'none'`.
   */
  detailMaxWidth?: string;
}

export interface FeaturesConfig {
  GESTIONE_PAGAMENTI?: boolean;
  GESTIONE_RISCOSSIONI?: boolean;
  MANUTENZIONE?: boolean;
  [key: string]: boolean | undefined;
}

export interface PreferencesConfig {
  TIMEOUT?: number;
  PAGE_SIZE?: number;
  [key: string]: number | string | boolean | undefined;
}

export interface MaintenanceConfig {
  enabled: boolean;
  title?: string;
  message?: string;
  estimatedEnd?: string;
  icon?: string;
}

export interface AppConfig {
  app: AppInfo;
  STANDALONE: boolean;
  GOVAPI: GovApiConfig;
  Auth: AuthConfig;
  Layout: LayoutConfig;
  Features?: FeaturesConfig;
  Preferences?: PreferencesConfig;
  Maintenance?: MaintenanceConfig;
}

export interface RuntimeConfig {
  AppConfig: AppConfig;
}

/* =========================================================================
 * BRANDING + THEME (caricato da `assets/config/theme.json`, allineato a govpay-portal)
 * ========================================================================= */

export interface LogoConfig {
  /** Logo esteso (mostrato quando sidebar espansa o nell'header). */
  full: string;
  /** Logo compatto (icona) per sidebar collassata. */
  compact: string;
  /** Mostra anche il titolo testuale accanto al logo. */
  showTitle?: boolean;
  /** Iniziali per il fallback se il logo non carica. */
  fallbackText?: string;
}

export interface ThemeTopBarConfig {
  background: string;
  text: string;
  border: string;
  height?: string;
}

export interface ThemeHeaderConfig {
  background: string;
  text: string;
  border: string;
  /** Mostra ombra sotto l'header. */
  showShadow?: boolean;
}

export interface ThemeSidebarConfig {
  background: string;
  border: string;
  text: string;
  textSecondary: string;
  /** Background voce hover. */
  itemHover: string;
  /** Background voce attiva. */
  itemActive: string;
  /** Colore icona/testo voce attiva. */
  itemActiveText: string;
  /** Background del footer (profile menu/about). */
  footerBackground: string;
  footerBorder: string;
}

export interface ThemeContentConfig {
  background: string;
  text: string;
  cardBackground: string;
  cardBorder: string;
  cardHover: string;
  muted: string;
  mutedForeground: string;
}

export interface ThemeButtonsConfig {
  primaryBackground: string;
  primaryText: string;
  primaryHover: string;
  secondaryBackground: string;
  secondaryText: string;
  secondaryBorder: string;
  secondaryHover: string;
}

export interface ThemeFontConfig {
  family: string;
  /** URL di un foglio @font-face (es. Google Fonts) — alternativa a `files`. */
  url?: string;
}

export interface ThemeFontsConfig {
  primary: ThemeFontConfig;
  heading?: ThemeFontConfig;
  mono?: ThemeFontConfig;
}

/**
 * Override grafico per `<lnk-tabs>`. Tutti i campi sono opzionali: quelli
 * non specificati ricadono sui token globali del tema (vedi i fallback
 * `var(...)` su `:host` nel componente).
 *
 * I valori sono CSS strings: colori, dimensioni con unità (`'0.5rem'`),
 * font-weight numerici (`500`, `600`) o ombre complete.
 */
export interface ThemeTabsConfig {
  /** Colori e tipografia condivisi tra le due varianti. */
  shared?: {
    text?: string;
    textHover?: string;
    textActive?: string;
    fontSize?: string;
    fontWeight?: string | number;
    fontWeightActive?: string | number;
    gap?: string;
    paddingX?: string;
    paddingY?: string;
    focusRing?: string;
    badgeBackground?: string;
    badgeText?: string;
  };
  /** Override variante `underline` (default). */
  underline?: {
    trackBorder?: string;
    indicatorColor?: string;
    indicatorSize?: string;
  };
  /** Override variante `segmented` (segmented control / pill). */
  segmented?: {
    trackBackground?: string;
    trackPadding?: string;
    trackRadius?: string;
    paddingX?: string;
    paddingY?: string;
    radius?: string;
    pillBackground?: string;
    pillText?: string;
    pillShadow?: string;
    pillFontWeight?: string | number;
    textHover?: string;
    badgeBackground?: string;
    badgeBackgroundActive?: string;
    badgeTextActive?: string;
  };
}

export interface ThemeConfig {
  topBar: ThemeTopBarConfig;
  header: ThemeHeaderConfig;
  sidebar: ThemeSidebarConfig;
  content: ThemeContentConfig;
  buttons: ThemeButtonsConfig;
  fonts?: ThemeFontsConfig;
  /** Override grafico per `<lnk-tabs>`. */
  tabs?: ThemeTabsConfig;
  /** Stati feedback. */
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
  /**
   * Override per la modalità dark. Tutti i campi sono opzionali: quelli non
   * specificati ricadono sul valore della modalità light. I sotto-oggetti
   * (topBar, header, ...) vengono shallow-merged con i corrispondenti light.
   */
  dark?: Partial<Omit<ThemeConfig, 'fonts' | 'dark'>>;
}

export interface BrandingConfig {
  logo: LogoConfig;
  primaryColor: string;
  secondaryColor: string;
  /** Tema completo (palette, font). Se assente vengono usati i default. */
  theme?: ThemeConfig;
}
