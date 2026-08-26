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
 * Registro statico delle 8 sotto-aree di Impostazioni. Guida l'overview
 * (card + link ai rispettivi editor) e le rotte. `codice` combacia con
 * l'`AreaImpostazioni.codice` dell'API `GET /impostazioni` per arricchire le
 * card con `abilitata`/`ultimaModifica` (best-effort). `built=false` = editor
 * non ancora disponibile (card disabilitata).
 */
export interface AreaImpostazioniDef {
  /** Codice API (per il match con l'overview). */
  codice: string;
  /** Slug della sotto-rotta client (`/impostazioni/<route>`). */
  route: string;
  labelKey: string;
  descKey: string;
  icon: string;
  /** Editor già implementato. */
  built: boolean;
}

export const AREE_IMPOSTAZIONI: readonly AreaImpostazioniDef[] = [
  { codice: 'servizioGDE', route: 'servizio-gde', labelKey: 'Impostazioni.Aree.ServizioGde.Nome', descKey: 'Impostazioni.Aree.ServizioGde.Desc', icon: 'bootstrapClockHistory', built: true },
  { codice: 'giornaleEventi', route: 'giornale-eventi', labelKey: 'Impostazioni.Aree.GiornaleEventi.Nome', descKey: 'Impostazioni.Aree.GiornaleEventi.Desc', icon: 'bootstrapListCheck', built: false },
  { codice: 'mailServer', route: 'mail-server', labelKey: 'Impostazioni.Aree.MailServer.Nome', descKey: 'Impostazioni.Aree.MailServer.Desc', icon: 'bootstrapEnvelope', built: false },
  { codice: 'mailTemplate', route: 'mail-template', labelKey: 'Impostazioni.Aree.MailTemplate.Nome', descKey: 'Impostazioni.Aree.MailTemplate.Desc', icon: 'bootstrapEnvelopePaper', built: true },
  { codice: 'appIoServer', route: 'app-io-server', labelKey: 'Impostazioni.Aree.AppIoServer.Nome', descKey: 'Impostazioni.Aree.AppIoServer.Desc', icon: 'bootstrapPhone', built: true },
  { codice: 'appIoTemplate', route: 'app-io-template', labelKey: 'Impostazioni.Aree.AppIoTemplate.Nome', descKey: 'Impostazioni.Aree.AppIoTemplate.Desc', icon: 'bootstrapChatDots', built: true },
  { codice: 'tracciatoCsv', route: 'tracciati-csv', labelKey: 'Impostazioni.Aree.TracciatiCsv.Nome', descKey: 'Impostazioni.Aree.TracciatiCsv.Desc', icon: 'bootstrapFileEarmarkCode', built: true },
  { codice: 'hardening', route: 'hardening', labelKey: 'Impostazioni.Aree.Hardening.Nome', descKey: 'Impostazioni.Aree.Hardening.Desc', icon: 'bootstrapShieldLock', built: true },
];
