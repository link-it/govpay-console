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
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListRefreshBannerComponent } from './list-refresh-banner.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

function render(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(ListRefreshBannerComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('ListRefreshBannerComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
    });
  });

  it('count=0: banner non renderizzato (visible=false)', () => {
    const fixture = render();
    expect(fixture.componentInstance.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('count=null + show=null: banner non renderizzato', () => {
    const fixture = render({ count: null, show: null });
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('count=5: banner visibile + testo include la chiave i18n', () => {
    const fixture = render({ count: 5 });
    expect(fixture.componentInstance.visible()).toBe(true);
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    // Senza traduzioni, ngx-translate ritorna la key raw.
    expect(btn.textContent).toContain('Common.NewItems');
  });

  it('count=null + show=true: banner visibile con genericMessageKey', () => {
    const fixture = render({ count: null, show: true });
    expect(fixture.componentInstance.visible()).toBe(true);
    expect(fixture.componentInstance['effectiveMessageKey']()).toBe('Common.NewData');
    expect(fixture.nativeElement.textContent).toContain('Common.NewData');
  });

  it('count=5 + show=false: NON visibile (show ha precedenza)', () => {
    const fixture = render({ count: 5, show: false });
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('click sul bottone emette refresh (count NON viene azzerato internamente)', () => {
    const fixture = render({ count: 3 });
    const handler = vi.fn();
    fixture.componentInstance.refresh.subscribe(handler);

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    // count resta a 3 (banner sparisce solo se il consumer azzera)
    expect(fixture.componentInstance.count()).toBe(3);
  });

  it("placement='floating' (default): applica la classe lnk-refresh-banner--floating", () => {
    const fixture = render({ count: 1 });
    const container = fixture.nativeElement.querySelector('.lnk-refresh-banner') as HTMLElement;
    expect(container.classList).toContain('lnk-refresh-banner--floating');
  });

  it("placement='sticky': applica la classe lnk-refresh-banner--sticky", () => {
    const fixture = render({ count: 1, placement: 'sticky' });
    const container = fixture.nativeElement.querySelector('.lnk-refresh-banner') as HTMLElement;
    expect(container.classList).toContain('lnk-refresh-banner--sticky');
    expect(container.classList).not.toContain('lnk-refresh-banner--floating');
  });

  it("placement='inline': nessuna classe sticky/floating", () => {
    const fixture = render({ count: 1, placement: 'inline' });
    const container = fixture.nativeElement.querySelector('.lnk-refresh-banner') as HTMLElement;
    expect(container.classList).not.toContain('lnk-refresh-banner--sticky');
    expect(container.classList).not.toContain('lnk-refresh-banner--floating');
  });

  it('iconName custom: il signal iconName() ritorna il valore passato', () => {
    const fixture = render({ count: 1, iconName: 'bootstrapBellFill' });
    expect(fixture.componentInstance.iconName()).toBe('bootstrapBellFill');
    // ng-icon e` renderizzato (input Angular, non attributo HTML)
    expect(fixture.nativeElement.querySelector('ng-icon')).toBeTruthy();
  });

  it("messageKey custom: usato come chiave nel template", () => {
    const fixture = render({ count: 2, messageKey: 'Pendenze.NewRecords' });
    expect(fixture.componentInstance['effectiveMessageKey']()).toBe('Pendenze.NewRecords');
    expect(fixture.nativeElement.textContent).toContain('Pendenze.NewRecords');
  });

  it("count=0 + show=true: visibile con genericMessageKey", () => {
    const fixture = render({ count: 0, show: true });
    expect(fixture.componentInstance.visible()).toBe(true);
    expect(fixture.componentInstance['effectiveMessageKey']()).toBe('Common.NewData');
  });

  it("size='md' (default) + color='primary' (default): le classi modifier sono applicate", () => {
    const fixture = render({ count: 1 });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('lnk-refresh-banner__btn--md');
    expect(btn.classList).toContain('lnk-refresh-banner__btn--primary');
  });

  it("size='sm': il bottone ha la classe modifier --sm", () => {
    const fixture = render({ count: 1, size: 'sm' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('lnk-refresh-banner__btn--sm');
    expect(btn.classList).not.toContain('lnk-refresh-banner__btn--md');
  });

  it("size='lg': il bottone ha la classe modifier --lg", () => {
    const fixture = render({ count: 1, size: 'lg' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('lnk-refresh-banner__btn--lg');
  });

  it("color='secondary': il bottone ha la classe modifier --secondary", () => {
    const fixture = render({ count: 1, color: 'secondary' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('lnk-refresh-banner__btn--secondary');
    expect(btn.classList).not.toContain('lnk-refresh-banner__btn--primary');
  });

  it("color='custom': il bottone ha la classe modifier --custom (consumer override via CSS vars)", () => {
    const fixture = render({ count: 1, color: 'custom' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('lnk-refresh-banner__btn--custom');
  });

  it("shape='pill' (default): il container NON ha la classe --button", () => {
    const fixture = render({ count: 1 });
    const container = fixture.nativeElement.querySelector('.lnk-refresh-banner') as HTMLElement;
    expect(container.classList).not.toContain('lnk-refresh-banner--button');
  });

  it("shape='button': container con --button + bottone con classi .btn .btn-primary", () => {
    const fixture = render({ count: 1, shape: 'button' });
    const container = fixture.nativeElement.querySelector('.lnk-refresh-banner') as HTMLElement;
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(container.classList).toContain('lnk-refresh-banner--button');
    expect(btn.classList).toContain('btn');
    expect(btn.classList).toContain('btn-primary');
    // La classe base e le modifier pill-style NON devono essere applicate:
    // sovrascriverebbero border-radius/shadow/padding delle .btn della lib.
    expect(btn.classList).not.toContain('lnk-refresh-banner__btn');
    expect(btn.classList).not.toContain('lnk-refresh-banner__btn--primary');
    expect(btn.classList).not.toContain('lnk-refresh-banner__btn--md');
  });

  it("shape='button' + color='secondary': il bottone ha .btn-secondary", () => {
    const fixture = render({ count: 1, shape: 'button', color: 'secondary' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('btn-secondary');
    expect(btn.classList).not.toContain('btn-primary');
  });

  it("shape='button' + size='sm': il bottone ha .btn-sm", () => {
    const fixture = render({ count: 1, shape: 'button', size: 'sm' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('btn-sm');
  });

  it("shape='button' + color='custom': il bottone fallback su .btn-primary", () => {
    const fixture = render({ count: 1, shape: 'button', color: 'custom' });
    const btn = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(btn.classList).toContain('btn-primary');
  });
});
