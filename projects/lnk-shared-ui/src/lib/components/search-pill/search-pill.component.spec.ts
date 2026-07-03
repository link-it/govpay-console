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

import { TestBed } from '@angular/core/testing';
import { NG_ICON_DIRECTIVES } from '@ng-icons/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchPillComponent } from './search-pill.component';
import type { SearchField, SearchState } from './search-pill.types';

const FIELDS: SearchField[] = [
  { id: 'idPendenza', label: 'ID pendenza', kind: 'text', span: 2 },
  { id: 'idDominio', label: 'Ente creditore', kind: 'select', options: ['', 'Comune X'], placeholder: 'Tutti', segmentedMax: 0 },
];

function render(inputs: Record<string, unknown> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: NG_ICON_DIRECTIVES, useValue: [], multi: true }],
  });
  const fixture = TestBed.createComponent(SearchPillComponent);
  fixture.componentRef.setInput('fields', FIELDS);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const el = (f: ReturnType<typeof render>, sel: string) => f.nativeElement.querySelector(sel) as HTMLElement;

describe('SearchPillComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('senza campo query: nessun input, l’area centrale è un bottone che apre i filtri', () => {
    const fixture = render({ placeholder: 'Cerca pendenza…' });
    expect(fixture.nativeElement.querySelector('input.pill__input')).toBeNull();
    const btn = el(fixture, 'button.pill__input--btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent?.trim()).toBe('Cerca pendenza…');
    btn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.form')).toBeTruthy();
  });

  it('con campo query: mostra l’input di ricerca libera', () => {
    const fixture = render({
      fields: [{ id: 'query', label: 'Q', kind: 'text' }, ...FIELDS],
      placeholder: 'Cerca…',
    });
    const input = fixture.nativeElement.querySelector('input.pill__input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Cerca…');
    expect(fixture.nativeElement.querySelector('button.pill__input--btn')).toBeNull();
  });

  it('il dropdown select è ricercabile e filtra le opzioni', () => {
    const fields: SearchField[] = [
      {
        id: 'idDominio', label: 'Ente creditore', kind: 'select',
        options: ['', 'Comune di Roma', 'Regione Lazio'],
        placeholder: 'Tutti', segmentedMax: 0, searchableFrom: 1,
      },
    ];
    const fixture = render({ fields });
    el(fixture, '.pill__filters').click();
    fixture.detectChanges();
    // Apri il dropdown del campo.
    el(fixture, '.fld__trigger').click();
    fixture.detectChanges();

    const searchInput = el(fixture, '.menu__search input') as HTMLInputElement;
    expect(searchInput).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.menu__item').length).toBe(3);

    searchInput.value = 'regione';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const labels = [...fixture.nativeElement.querySelectorAll('.menu__item .menu__label')]
      .map((e) => (e as HTMLElement).textContent?.trim());
    expect(labels).toEqual(['Regione Lazio']);
  });

  it('apre il popover e renderizza il form con i campi', () => {
    const fixture = render();
    el(fixture, '.pill__filters').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.fld').length).toBe(2);
  });

  it('mostra un chip per un filtro valorizzato ed emette search su "Cerca"', () => {
    const value: SearchState = { query: '', filters: { idDominio: 'Comune X' }, sort: '', dir: 'desc' };
    const fixture = render({ value });
    expect(fixture.nativeElement.querySelector('lnk-search-chip')).toBeTruthy();

    const spy = vi.fn();
    fixture.componentInstance.search.subscribe(spy);
    el(fixture, '.pill__filters').click();
    fixture.detectChanges();
    el(fixture, '.sbtn--primary').click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('rimuovendo un chip dalla barra parte la ricerca', () => {
    const value: SearchState = { query: '', filters: { idDominio: 'Comune X' }, sort: '', dir: 'desc' };
    const fixture = render({ value });
    const spy = vi.fn();
    fixture.componentInstance.search.subscribe(spy);
    el(fixture, 'lnk-search-chip .chip__remove').click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('cliccando la lente si rilancia la ricerca sullo stato committato', () => {
    const value: SearchState = { query: '', filters: { idDominio: 'Comune X' }, sort: '', dir: 'desc' };
    const fixture = render({ value });
    const spy = vi.fn();
    fixture.componentInstance.search.subscribe(spy);
    el(fixture, '.pill__lead').click();
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(value);
  });

  it('cliccando il contenuto di un chip si apre il pannello dei filtri', () => {
    const value: SearchState = { query: '', filters: { idDominio: 'Comune X' }, sort: '', dir: 'desc' };
    const fixture = render({ value });
    // Pannello inizialmente chiuso.
    expect(fixture.nativeElement.querySelector('.form')).toBeFalsy();
    el(fixture, 'lnk-search-chip .chip__main').click();
    fixture.detectChanges();
    // Ora aperto, con la bozza inizializzata dal committato.
    expect(fixture.nativeElement.querySelector('.form')).toBeTruthy();
    expect(el(fixture, '.fld__trigger-text').textContent?.trim()).toBe('Comune X');
  });

  it('reset + Annulla non altera i valori committati: riaprendo la bozza è ripristinata', () => {
    const value: SearchState = { query: '', filters: { idDominio: 'Comune X' }, sort: '', dir: 'desc' };
    const fixture = render({ value });

    // Apri: la bozza mostra il valore committato.
    el(fixture, '.pill__filters').click();
    fixture.detectChanges();
    expect(el(fixture, '.fld__trigger-text').textContent?.trim()).toBe('Comune X');

    // Reset: svuota la bozza (il chip committato resta nella barra).
    el(fixture, '.form__reset').click();
    fixture.detectChanges();
    expect(el(fixture, '.fld__trigger-text').textContent?.trim()).toBe('Tutti');
    expect(fixture.nativeElement.querySelector('lnk-search-chip')).toBeTruthy();

    // Annulla (Chiudi) e riapri: la bozza è ripristinata dal committato.
    el(fixture, '.sbtn--ghost').click();
    fixture.detectChanges();
    el(fixture, '.pill__filters').click();
    fixture.detectChanges();
    expect(el(fixture, '.fld__trigger-text').textContent?.trim()).toBe('Comune X');
  });
});
