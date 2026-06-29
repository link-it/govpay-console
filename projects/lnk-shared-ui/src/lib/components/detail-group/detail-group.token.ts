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

import { InjectionToken } from '@angular/core';

/**
 * Marker DI token che indica "siamo dentro un `<lnk-detail-group>`".
 *
 * Il `DetailGroupComponent` lo fornisce con `useValue: true`. Il
 * `DetailSectionComponent` lo legge `optional` per decidere il
 * `variant` effettivo quando l'input e` `'auto'`.
 *
 * Vive in un file dedicato per evitare la dipendenza circolare
 * detail-section ↔ detail-group: i due componenti possono importare
 * il token senza importarsi a vicenda.
 */
export const LNK_IN_DETAIL_GROUP = new InjectionToken<boolean>('LNK_IN_DETAIL_GROUP');
