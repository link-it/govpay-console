/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
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

import { Density } from './search-pill.types';

/**
 * Token di dimensionamento per densità. `h` è l'altezza base del controllo;
 * la pillola aggiunge 8px. Colori/superfici NON sono qui: il componente usa
 * direttamente le variabili di tema (`--primary`, `--card-bg`, …), così il
 * dark mode segue automaticamente la classe `.dark` globale.
 */
export const DENSITY_TOKENS: Record<Density, {
  h: number; fs: number; chipH: number; chipFs: number;
}> = {
  compact:     { h: 36, fs: 13,   chipH: 24, chipFs: 12 },
  regular:     { h: 44, fs: 14,   chipH: 28, chipFs: 12.5 },
  comfortable: { h: 52, fs: 15,   chipH: 32, chipFs: 13 },
};
