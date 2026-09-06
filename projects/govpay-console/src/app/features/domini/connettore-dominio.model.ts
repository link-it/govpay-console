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
 * Modelli **Connettori del dominio V2** (notifica pagamenti). Sono cinque
 * risorse singleton per dominio: `mypivot`, `secim`, `govpay`, `hypersic-apk`,
 * `maggioli-jppa`. Le credenziali (write-only) sono su un endpoint dedicato
 * `/credenziali` per `govpay` e `maggioli-jppa`.
 *
 * La rappresentazione è modellata in modo permissivo: i campi editati dalla UI
 * sono descritti dai {@link CONNETTORI_DOMINIO}; le sotto-strutture ricche non
 * modellate (`auth`, `contenuti`, …) vengono preservate as-is nel replace.
 */

/** Segmento di path del connettore singleton. */
export type ConnettoreDominioTipo = 'mypivot' | 'secim' | 'govpay' | 'hypersic-apk' | 'maggioli-jppa' | 'send';

/**
 * Rappresentazione permissiva del connettore (le GET non includono credenziali).
 * `abilitato` è assente per i connettori senza flag on/off (es. `send`).
 */
export interface ConnettoreDominio {
  abilitato?: boolean;
  [k: string]: unknown;
}

/** Tipo di campo renderizzato dalla form dinamica. */
export type ConnettoreFieldKind = 'text' | 'checkbox' | 'number' | 'select' | 'list';

/** Descrittore di un campo editabile del connettore. */
export interface ConnettoreFieldDef {
  key: string;
  labelKey: string;
  kind: ConnettoreFieldKind;
  /** Valori ammessi per `kind = 'select'`. */
  options?: string[];
}

/** Descrittore di un connettore del dominio (tipo, label, campi, credenziali). */
export interface ConnettoreDominioDescriptor {
  tipo: ConnettoreDominioTipo;
  labelKey: string;
  fields: ConnettoreFieldDef[];
  /** Se true espone la sotto-form credenziali (write-only). */
  hasCredenziali: boolean;
  /**
   * Se `false` il connettore non ha un flag `abilitato` on/off (es. `send`:
   * attivo appena configurato). Default (assente) = `true`.
   */
  hasAbilitato?: boolean;
}

const EMAIL_FIELDS: ConnettoreFieldDef[] = [
  { key: 'emailIndirizzi', labelKey: 'Domini.Connettori.EmailIndirizzi', kind: 'list' },
  { key: 'emailSubject', labelKey: 'Domini.Connettori.EmailSubject', kind: 'text' },
  { key: 'emailAllegato', labelKey: 'Domini.Connettori.EmailAllegato', kind: 'checkbox' },
  { key: 'downloadBaseUrl', labelKey: 'Domini.Connettori.DownloadBaseUrl', kind: 'text' },
  { key: 'fileSystemPath', labelKey: 'Domini.Connettori.FileSystemPath', kind: 'text' },
];

const TIPO_NOTIFICA_OPTS = ['EMAIL', 'FILESYSTEM'];

/** Elenco ordinato dei connettori del dominio con i rispettivi campi. */
export const CONNETTORI_DOMINIO: ConnettoreDominioDescriptor[] = [
  {
    tipo: 'mypivot',
    labelKey: 'Domini.Connettori.Mypivot',
    hasCredenziali: false,
    fields: [
      { key: 'codiceIPA', labelKey: 'Domini.Connettori.CodiceIPA', kind: 'text' },
      { key: 'tipoConnettore', labelKey: 'Domini.Connettori.TipoConnettore', kind: 'select', options: TIPO_NOTIFICA_OPTS },
      { key: 'versioneCsv', labelKey: 'Domini.Connettori.VersioneCsv', kind: 'text' },
      { key: 'tipiPendenza', labelKey: 'Domini.Connettori.TipiPendenza', kind: 'list' },
      { key: 'intervalloCreazioneTracciato', labelKey: 'Domini.Connettori.Intervallo', kind: 'number' },
      ...EMAIL_FIELDS,
    ],
  },
  {
    tipo: 'secim',
    labelKey: 'Domini.Connettori.Secim',
    hasCredenziali: false,
    fields: [
      { key: 'codiceCliente', labelKey: 'Domini.Connettori.CodiceCliente', kind: 'text' },
      { key: 'codiceIstituto', labelKey: 'Domini.Connettori.CodiceIstituto', kind: 'text' },
      { key: 'tipoConnettore', labelKey: 'Domini.Connettori.TipoConnettore', kind: 'select', options: TIPO_NOTIFICA_OPTS },
      { key: 'versioneCsv', labelKey: 'Domini.Connettori.VersioneCsv', kind: 'text' },
      { key: 'tipiPendenza', labelKey: 'Domini.Connettori.TipiPendenza', kind: 'list' },
      { key: 'intervalloCreazioneTracciato', labelKey: 'Domini.Connettori.Intervallo', kind: 'number' },
      ...EMAIL_FIELDS,
    ],
  },
  {
    tipo: 'govpay',
    labelKey: 'Domini.Connettori.Govpay',
    hasCredenziali: true,
    fields: [
      { key: 'tipoConnettore', labelKey: 'Domini.Connettori.TipoConnettore', kind: 'select', options: ['EMAIL', 'FILESYSTEM', 'REST'] },
      { key: 'versioneZip', labelKey: 'Domini.Connettori.VersioneZip', kind: 'text' },
      { key: 'tipiPendenza', labelKey: 'Domini.Connettori.TipiPendenza', kind: 'list' },
      { key: 'url', labelKey: 'Domini.Connettori.Url', kind: 'text' },
      { key: 'versioneApi', labelKey: 'Domini.Connettori.VersioneApi', kind: 'select', options: ['REST v1'] },
      { key: 'intervalloCreazioneTracciato', labelKey: 'Domini.Connettori.Intervallo', kind: 'number' },
      ...EMAIL_FIELDS,
    ],
  },
  {
    tipo: 'hypersic-apk',
    labelKey: 'Domini.Connettori.HypersicApk',
    hasCredenziali: false,
    fields: [
      { key: 'tipoConnettore', labelKey: 'Domini.Connettori.TipoConnettore', kind: 'select', options: TIPO_NOTIFICA_OPTS },
      { key: 'versioneCsv', labelKey: 'Domini.Connettori.VersioneCsv', kind: 'text' },
      { key: 'tipiPendenza', labelKey: 'Domini.Connettori.TipiPendenza', kind: 'list' },
      { key: 'intervalloCreazioneTracciato', labelKey: 'Domini.Connettori.Intervallo', kind: 'number' },
      ...EMAIL_FIELDS,
    ],
  },
  {
    tipo: 'maggioli-jppa',
    labelKey: 'Domini.Connettori.MaggioliJppa',
    hasCredenziali: true,
    fields: [
      { key: 'inviaTracciatoEsito', labelKey: 'Domini.Connettori.InviaTracciatoEsito', kind: 'checkbox' },
      { key: 'url', labelKey: 'Domini.Connettori.Url', kind: 'text' },
      { key: 'fileSystemPath', labelKey: 'Domini.Connettori.FileSystemPath', kind: 'text' },
      { key: 'emailIndirizzi', labelKey: 'Domini.Connettori.EmailIndirizzi', kind: 'list' },
      { key: 'emailSubject', labelKey: 'Domini.Connettori.EmailSubject', kind: 'text' },
      { key: 'emailAllegato', labelKey: 'Domini.Connettori.EmailAllegato', kind: 'checkbox' },
      { key: 'downloadBaseUrl', labelKey: 'Domini.Connettori.DownloadBaseUrl', kind: 'text' },
    ],
  },
  {
    // SEND (NotificationPriceV23): niente flag `abilitato` (attivo appena
    // configurato); `auth` è preservato as-is nel replace.
    tipo: 'send',
    labelKey: 'Domini.Connettori.Send',
    hasCredenziali: true,
    hasAbilitato: false,
    fields: [
      { key: 'url', labelKey: 'Domini.Connettori.Url', kind: 'text' },
      { key: 'abilitaGDE', labelKey: 'Domini.Connettori.AbilitaGDE', kind: 'checkbox' },
    ],
  },
];
