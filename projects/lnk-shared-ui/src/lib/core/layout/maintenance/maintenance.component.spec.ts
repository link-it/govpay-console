/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigService } from '../../config';
import { MaintenanceComponent } from './maintenance.component';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

class FakeConfigService {
  private readonly _config = signal<unknown>(null);
  readonly appConfig = signal<unknown>(null);

  set(maintenance: Record<string, unknown> | null) {
    this.appConfig.set(maintenance ? { Maintenance: maintenance } : null);
  }
}

function setup(maintenance: Record<string, unknown> | null) {
  const fake = new FakeConfigService();
  fake.set(maintenance);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ConfigService, useValue: fake },
      provideTranslateService({
        fallbackLang: 'it',
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
  });
}

describe('MaintenanceComponent', () => {
  beforeEach(() => {
    setup(null);
  });

  it('senza Maintenance config: title/message ricadono sui fallback i18n', () => {
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    // Senza traduzioni reali, TranslateService restituisce la key raw
    expect(fixture.componentInstance.title()).toBe('Maintenance.Title');
    expect(fixture.componentInstance.message()).toBe('Maintenance.Message');
  });

  it('Maintenance.icon valorizzato sovrascrive il default', () => {
    setup({ icon: 'bootstrapTools' });
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.icon()).toBe('bootstrapTools');
  });

  it("Maintenance.icon undefined → fallback 'bootstrapGear'", () => {
    setup({});
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.icon()).toBe('bootstrapGear');
  });

  it("title raw string (no i18n key): viene mostrata as-is", () => {
    // "Servizio offline" non contiene '.' e non e` una key i18n.
    setup({ title: 'Servizio offline' });
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.title()).toBe('Servizio offline');
  });

  it("estimatedEnd: passa attraverso dal config", () => {
    setup({ estimatedEnd: '2026-06-15 18:00' });
    const fixture = TestBed.createComponent(MaintenanceComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.estimatedEnd()).toBe('2026-06-15 18:00');
  });
});
