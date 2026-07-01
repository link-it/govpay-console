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

import { Injector } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListStateService } from './list-state.service';

function createService(): ListStateService {
  return Injector.create({ providers: [ListStateService] }).get(ListStateService);
}

describe('ListStateService', () => {
  let svc: ListStateService;

  beforeEach(() => {
    svc = createService();
  });

  it('get su chiave inesistente ritorna undefined', () => {
    expect(svc.get('pendenze')).toBeUndefined();
  });

  it('set + get round-trip preserva il valore tipizzato', () => {
    interface PendenzeState {
      filters: { search: string };
      page: number;
    }
    const state: PendenzeState = { filters: { search: 'foo' }, page: 2 };
    svc.set<PendenzeState>('pendenze', state);
    expect(svc.get<PendenzeState>('pendenze')).toEqual(state);
  });

  it('set sovrascrive lo stato precedente per la stessa chiave', () => {
    svc.set('pendenze', { v: 1 });
    svc.set('pendenze', { v: 2 });
    expect(svc.get<{ v: number }>('pendenze')?.v).toBe(2);
  });

  it('clear(key) rimuove solo quella chiave', () => {
    svc.set('a', 1);
    svc.set('b', 2);
    svc.clear('a');
    expect(svc.get('a')).toBeUndefined();
    expect(svc.get('b')).toBe(2);
  });

  it('clear() senza chiave azzera tutto', () => {
    svc.set('a', 1);
    svc.set('b', 2);
    svc.clear();
    expect(svc.get('a')).toBeUndefined();
    expect(svc.get('b')).toBeUndefined();
  });
});
