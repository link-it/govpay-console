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

import { OverlayModule } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ItemTypeComponent } from './item-type.component';
import type { DisplayConfig, ItemTypeElement } from '../item-row/display-config.types';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(
  data: unknown,
  elem: ItemTypeElement,
  config: DisplayConfig | null = null
) {
  const fixture = TestBed.createComponent(ItemTypeComponent);
  fixture.componentRef.setInput('data', data);
  fixture.componentRef.setInput('elem', elem);
  fixture.componentRef.setInput('config', config);
  fixture.detectChanges();
  return fixture;
}

describe('ItemTypeComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });

  it("type='text': value passa attraverso il raw stringificato", () => {
    const f = render({ name: 'Alfa' }, { type: 'text', field: 'name' });
    expect(f.componentInstance.value()).toBe('Alfa');
  });

  it("type='text': field null/undefined → stringa vuota", () => {
    const f = render({ name: null }, { type: 'text', field: 'name' });
    expect(f.componentInstance.value()).toBe('');
  });

  it("type='text': fallback su elem.default se il raw è null", () => {
    const f = render({}, { type: 'text', field: 'missing', default: 'N/D' });
    expect(f.componentInstance.value()).toBe('N/D');
  });

  it("type='text' con i18nPrefix flat: traduce ${prefix}.${value}", () => {
    const f = render(
      { stato: 'OK' },
      { type: 'text', field: 'stato', i18nPrefix: 'Stati' }
    );
    // No translations → la traduzione ritorna la chiave → fallback al raw
    expect(f.componentInstance.value()).toBe('OK');
  });

  it("type='currency': formatta come euro (es. 1234 → '1.234,00 €' in it-IT, fallback runtime)", () => {
    const f = render({ totale: 100 }, { type: 'currency', field: 'totale' });
    // formatEuro usa Intl, runtime-dependent → testo non vuoto e contiene la cifra
    expect(f.componentInstance.value()).toMatch(/100/);
  });

  it("type='cardinal' antepone '#' al valore", () => {
    const f = render({ pos: 5 }, { type: 'cardinal', field: 'pos' });
    expect(f.componentInstance.value()).toBe('#5');
  });

  it("type='simplelabel': testo statico, NON dipende da data", () => {
    const f = render(null, { type: 'simplelabel', label: 'Etichetta' });
    expect(f.componentInstance.value()).toBe('Etichetta');
  });

  it("type='message': passa il field come testo (raw key i18n)", () => {
    const f = render({}, { type: 'message', field: 'Messages.Hello' });
    expect(f.componentInstance.value()).toBe('Messages.Hello');
  });

  it("type='status' usa option.label come testo", () => {
    const config: DisplayConfig = {
      options: {
        ESITI: { values: { OK: { label: 'Esiti.Ok' } } },
      },
    };
    const f = render(
      { esito: 'OK' },
      { type: 'status', field: 'esito', options: 'ESITI' },
      config
    );
    expect(f.componentInstance.value()).toBe('Esiti.Ok');
  });

  it("type='status' senza option entry corrispondente: fallback al raw", () => {
    const config: DisplayConfig = {
      options: { ESITI: { values: { OK: { label: 'Esiti.Ok' } } } },
    };
    const f = render(
      { esito: 'KO' },
      { type: 'status', field: 'esito', options: 'ESITI' },
      config
    );
    expect(f.componentInstance.value()).toBe('KO');
  });

  it("type='icon' usa option.icon, poi elem.icon, poi raw", () => {
    const config: DisplayConfig = {
      options: { I: { values: { v1: { icon: 'bootstrapStar' } } } },
    };
    const f = render(
      { tipo: 'v1' },
      { type: 'icon', field: 'tipo', options: 'I', icon: 'fallback' },
      config
    );
    expect(f.componentInstance.value()).toBe('bootstrapStar');
  });

  it("type='icon' senza option corrispondente: elem.icon fallback", () => {
    const f = render(
      { tipo: 'v1' },
      { type: 'icon', field: 'tipo', icon: 'bootstrapCheck' }
    );
    expect(f.componentInstance.value()).toBe('bootstrapCheck');
  });

  it("tooltip: hideTooltip=true ritorna stringa vuota", () => {
    const f = render(
      { name: 'x' },
      { type: 'text', field: 'name', tooltip: 'Tip', hideTooltip: true }
    );
    expect(f.componentInstance.tooltip()).toBe('');
  });

  it("tooltip stringa: se è path che risolve sul data, usa il valore raw", () => {
    const f = render(
      { name: 'x', extra: 'descrizione lunga' },
      { type: 'text', field: 'name', tooltip: 'extra' }
    );
    expect(f.componentInstance.tooltip()).toBe('descrizione lunga');
  });

  it("tooltipPlacement: 'top' → 'above', 'bottom' → 'below'", () => {
    let f = render({ a: 1 }, { type: 'text', field: 'a', tooltipPlacement: 'top' });
    expect(f.componentInstance.tooltipPlacement()).toBe('above');
    f = render({ a: 1 }, { type: 'text', field: 'a', tooltipPlacement: 'bottom' });
    expect(f.componentInstance.tooltipPlacement()).toBe('below');
  });

  it("tooltipPlacement: default 'above'", () => {
    const f = render({ a: 1 }, { type: 'text', field: 'a' });
    expect(f.componentInstance.tooltipPlacement()).toBe('above');
  });

  it("labelText per type='label' senza optionGroup.label: stringa vuota (no prefisso)", () => {
    const f = render(
      { cat: 'X' },
      { type: 'label', field: 'cat', options: 'INESISTENTE' }
    );
    expect(f.componentInstance.labelText()).toBe('');
  });

  it("labelText per type='label' con optionGroup.label: usa quella i18n", () => {
    const config: DisplayConfig = {
      options: { G: { label: 'Categorie.Title', values: {} } },
    };
    const f = render({ cat: 'X' }, { type: 'label', field: 'cat', options: 'G' }, config);
    expect(f.componentInstance.labelText()).toBe('Categorie.Title');
  });
});
