/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
