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
import { beforeEach, describe, expect, it } from 'vitest';
import { LNK_TABS_DEFAULTS, TabsComponent, provideTabsDefaults, type TabDef } from './tabs.component';
import { LayoutOverridesService } from '../../core/system/layout-overrides.service';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

const TABS: TabDef[] = [
  { id: 'dati', labelKey: 'Detail.Dati' },
  { id: 'eventi', labelKey: 'Detail.Eventi', badge: 12 },
  { id: 'allegati', labelKey: 'Detail.Allegati', disabled: true },
];

function render(activeId = 'dati', variant?: 'underline' | 'segmented', size?: 'md' | 'sm') {
  const fixture = TestBed.createComponent(TabsComponent);
  fixture.componentRef.setInput('tabs', TABS);
  fixture.componentRef.setInput('activeId', activeId);
  if (variant !== undefined) fixture.componentRef.setInput('variant', variant);
  if (size !== undefined) fixture.componentRef.setInput('size', size);
  fixture.detectChanges();
  return fixture;
}

function tablistClasses(fixture: ReturnType<typeof render>): DOMTokenList {
  return (fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement).classList;
}

describe('TabsComponent', () => {
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

  it('renderizza un button per ogni tab + aria-selected sull\'attivo', () => {
    const fixture = render('dati');
    const buttons = fixture.nativeElement.querySelectorAll('button[role="tab"]');
    expect(buttons.length).toBe(3);
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    expect(buttons[1].getAttribute('aria-selected')).toBe('false');
    expect(buttons[2].getAttribute('aria-selected')).toBe('false');
  });

  it('classi tablist: underline (default) + size md', () => {
    const fixture = render('dati', 'underline', 'md');
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist.classList).toContain('lnk-tablist--underline');
    expect(tablist.classList).toContain('lnk-tabs-size--md');
  });

  it('variant segmented + size sm applica le classi corrispondenti', () => {
    const fixture = render('dati', 'segmented', 'sm');
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist.classList).toContain('lnk-tablist--segmented');
    expect(tablist.classList).toContain('lnk-tabs-size--sm');
  });

  it('tutti i tab sono raggiungibili con Tab (tabindex 0)', () => {
    const fixture = render('eventi');
    const buttons = fixture.nativeElement.querySelectorAll('button[role="tab"]');
    expect([...buttons].map((b) => (b as HTMLElement).getAttribute('tabindex'))).toEqual(['0', '0', '0']);
  });

  it('badge numerico viene renderizzato', () => {
    const fixture = render();
    const badges = fixture.nativeElement.querySelectorAll('.lnk-tab__badge');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent.trim()).toBe('12');
  });

  it('tab disabled: attributo disabled presente, click ignorato', () => {
    const fixture = render('dati');
    const buttons = fixture.nativeElement.querySelectorAll('button[role="tab"]') as NodeListOf<HTMLButtonElement>;
    const disabled = buttons[2];
    expect(disabled.hasAttribute('disabled')).toBe(true);

    disabled.click();
    fixture.detectChanges();
    // ActiveId resta `dati` (non si è spostato sul tab disabled)
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
  });

  it('click su un tab abilitato aggiorna activeId (two-way model)', () => {
    const fixture = render('dati');
    const buttons = fixture.nativeElement.querySelectorAll('button[role="tab"]') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeId()).toBe('eventi');
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
  });

  function press(fixture: ReturnType<typeof render>, key: string): void {
    const tablist = fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement;
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

  it('ArrowRight sposta la selezione al tab successivo', () => {
    const fixture = render('dati');
    press(fixture, 'ArrowRight');
    expect(fixture.componentInstance.activeId()).toBe('eventi');
  });

  it('ArrowRight salta i tab disabilitati e fa il wrap', () => {
    const fixture = render('eventi'); // il successivo (allegati) è disabled → wrap a dati
    press(fixture, 'ArrowRight');
    expect(fixture.componentInstance.activeId()).toBe('dati');
  });

  it('ArrowLeft va al precedente; Home/End ai bordi (saltando i disabled)', () => {
    const fixture = render('eventi');
    press(fixture, 'ArrowLeft');
    expect(fixture.componentInstance.activeId()).toBe('dati');
    press(fixture, 'End');
    expect(fixture.componentInstance.activeId()).toBe('eventi'); // allegati disabled
    press(fixture, 'Home');
    expect(fixture.componentInstance.activeId()).toBe('dati');
  });

  it('senza variant/size né default DI usa il fallback underline/md', () => {
    const fixture = render('dati'); // nessun input variant/size
    const cls = tablistClasses(fixture);
    expect(cls).toContain('lnk-tablist--underline');
    expect(cls).toContain('lnk-tabs-size--md');
  });
});

describe('TabsComponent — default configurabili (LNK_TABS_DEFAULTS)', () => {
  function configure(defaults?: { variant?: 'underline' | 'segmented'; size?: 'md' | 'sm' }): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'it',
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
        ...(defaults ? [provideTabsDefaults(defaults)] : []),
      ],
    });
  }

  it('provideTabsDefaults registra il token con i valori forniti', () => {
    configure({ variant: 'segmented', size: 'sm' });
    expect(TestBed.inject(LNK_TABS_DEFAULTS)).toEqual({ variant: 'segmented', size: 'sm' });
  });

  it('il default DI si applica a tutte le istanze senza input locale', () => {
    configure({ variant: 'segmented', size: 'sm' });
    const cls = tablistClasses(render('dati'));
    expect(cls).toContain('lnk-tablist--segmented');
    expect(cls).toContain('lnk-tabs-size--sm');
  });

  it("l'input locale vince sul default DI", () => {
    configure({ variant: 'segmented', size: 'sm' });
    const cls = tablistClasses(render('dati', 'underline', 'md'));
    expect(cls).toContain('lnk-tablist--underline');
    expect(cls).toContain('lnk-tabs-size--md');
  });

  it('default parziale: variant dal DI, size dal fallback', () => {
    configure({ variant: 'segmented' }); // size non fornito
    const cls = tablistClasses(render('dati'));
    expect(cls).toContain('lnk-tablist--segmented');
    expect(cls).toContain('lnk-tabs-size--md'); // fallback
  });

  it("l'override runtime (Tweaks) vince sul default DI ma non sull'input locale", () => {
    configure({ variant: 'segmented' });
    const overrides = TestBed.inject(LayoutOverridesService);
    overrides.tabsVariant.set('underline');
    // Nessun input locale → l'override runtime prevale sul default DI ('segmented').
    expect(tablistClasses(render('dati'))).toContain('lnk-tablist--underline');
    // Con input locale, quest'ultimo prevale sull'override runtime.
    expect(tablistClasses(render('dati', 'segmented'))).toContain('lnk-tablist--segmented');
    overrides.tabsVariant.set(null);
  });
});
