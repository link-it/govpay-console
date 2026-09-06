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

import { describe, expect, it } from 'vitest';
import { formatOrdinamento } from './sort';

describe('formatOrdinamento', () => {
  it('asc → prefisso +campo', () => {
    expect(formatOrdinamento({ key: 'dataCaricamento', direction: 'asc' })).toBe('+dataCaricamento');
  });

  it('desc → prefisso -campo', () => {
    expect(formatOrdinamento({ key: 'dataCaricamento', direction: 'desc' })).toBe('-dataCaricamento');
  });

  it('null/undefined → undefined', () => {
    expect(formatOrdinamento(null)).toBeUndefined();
    expect(formatOrdinamento(undefined)).toBeUndefined();
  });
});
