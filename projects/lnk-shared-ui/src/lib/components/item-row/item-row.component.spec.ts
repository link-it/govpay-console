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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemRowComponent } from './item-row.component';
import type { DisplayConfig } from './display-config.types';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

const DATA = { id: '1', name: 'Alfa', meta: 'M' };

const CONFIG: DisplayConfig = {
  itemRow: {
    primaryText: [{ type: 'text', field: 'name' }],
    metadata: { text: [{ type: 'text', field: 'meta' }], label: [] },
  },
};

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(ItemRowComponent);
  fixture.componentRef.setInput('data', DATA);
  fixture.componentRef.setInput('config', CONFIG);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('ItemRowComponent', () => {
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

  it("source computed: senza 'source', restituisce data raw", () => {
    const fixture = render();
    expect(fixture.componentInstance['source']()).toEqual(DATA);
  });

  it("source computed: con data.source, restituisce data.source", () => {
    const wrapped = { source: { id: '1', name: 'Wrapped' } };
    const fixture = render({ data: wrapped });
    expect(fixture.componentInstance['source']()).toEqual(wrapped.source);
  });

  it("rowConfig: usa il configRow specificato", () => {
    const cfg: DisplayConfig = {
      itemRow: { primaryText: [{ type: 'text', field: 'name' }] },
      simpleItem: { primaryText: [{ type: 'text', field: 'meta' }] },
    };
    const fixture = render({ config: cfg, configRow: 'simpleItem' });
    expect(fixture.componentInstance['rowConfig']()?.primaryText?.[0].field).toBe('meta');
  });

  it("rowConfig: fallback a itemRow se configRow non esiste", () => {
    const cfg: DisplayConfig = {
      itemRow: { primaryText: [{ type: 'text', field: 'name' }] },
    };
    const fixture = render({ config: cfg, configRow: 'inesistente' });
    expect(fixture.componentInstance['rowConfig']()?.primaryText?.[0].field).toBe('name');
  });

  it("linkSection: default 'primaryText'", () => {
    const fixture = render();
    expect(fixture.componentInstance['linkSection']()).toBe('primaryText');
  });

  it("linkSection: avatar se avatar.link e niente link su primaryText/secondaryText", () => {
    const cfg: DisplayConfig = {
      itemRow: {
        avatar: { type: 'text', field: 'name', link: true },
        primaryText: [{ type: 'text', field: 'name' }],
      },
    };
    const fixture = render({ config: cfg });
    expect(fixture.componentInstance['linkSection']()).toBe('avatar');
  });

  it("linkSection: secondaryText se ha un element con link", () => {
    const cfg: DisplayConfig = {
      itemRow: {
        primaryText: [{ type: 'text', field: 'name' }],
        secondaryText: [{ type: 'text', field: 'meta', link: true }],
      },
    };
    const fixture = render({ config: cfg });
    expect(fixture.componentInstance['linkSection']()).toBe('secondaryText');
  });

  it("onClick emette rowClick se clickable=true", () => {
    const fixture = render();
    const handler = vi.fn();
    fixture.componentInstance.rowClick.subscribe(handler);

    const event = { stopPropagation: vi.fn() } as unknown as Event;
    fixture.componentInstance['onClick'](event);

    expect(handler).toHaveBeenCalledWith(DATA);
    expect((event.stopPropagation as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
  });

  it("onClick non emette se clickable=false", () => {
    const fixture = render({ clickable: false });
    const handler = vi.fn();
    fixture.componentInstance.rowClick.subscribe(handler);

    fixture.componentInstance['onClick'](new MouseEvent('click'));
    expect(handler).not.toHaveBeenCalled();
  });
});
