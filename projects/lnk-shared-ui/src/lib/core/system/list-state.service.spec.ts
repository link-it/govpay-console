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
    // Storage condiviso tra istanze: azzera per isolare i test (get usa lo
    // storage come fallback).
    sessionStorage.clear();
    localStorage.clear();
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

  it('senza persist non scrive su storage', () => {
    svc.set('x', { v: 1 });
    expect(sessionStorage.getItem('lnk-list-state:x')).toBeNull();
    expect(localStorage.getItem('lnk-list-state:x')).toBeNull();
  });

  it('persist=true scrive su sessionStorage e una nuova istanza lo ripristina', () => {
    svc.set('pendenze', { v: 1 }, true);
    expect(sessionStorage.getItem('lnk-list-state:pendenze')).toBeTruthy();
    expect(createService().get<{ v: number }>('pendenze')?.v).toBe(1);
  });

  it("persist='local' usa localStorage (non sessionStorage)", () => {
    svc.set('y', { v: 2 }, 'local');
    expect(localStorage.getItem('lnk-list-state:y')).toBeTruthy();
    expect(sessionStorage.getItem('lnk-list-state:y')).toBeNull();
    expect(createService().get<{ v: number }>('y')?.v).toBe(2);
  });

  it('un set con persist falsy NON cancella uno stato già persistito (race config async)', () => {
    svc.set('r', { v: 1 }, true);
    // Nuova istanza (es. dopo refresh) con flag non ancora risolto:
    createService().set('r', { v: 1 }, false);
    expect(sessionStorage.getItem('lnk-list-state:r')).toBeTruthy();
  });

  it('il valore persistito è offuscato (non testo in chiaro) ma round-trip corretto', () => {
    const state = { filters: { identificativoDebitore: 'RSSMRA80A01H501U' } };
    svc.set('pendenze', state, true);
    const raw = sessionStorage.getItem('lnk-list-state:pendenze')!;
    expect(raw).not.toContain('identificativoDebitore');
    expect(raw).not.toContain('RSSMRA80A01H501U');
    expect(createService().get('pendenze')).toEqual(state);
  });

  it('clear(key) rimuove anche dallo storage persistito', () => {
    svc.set('z', { v: 3 }, true);
    svc.clear('z');
    expect(sessionStorage.getItem('lnk-list-state:z')).toBeNull();
    expect(createService().get('z')).toBeUndefined();
  });
});
