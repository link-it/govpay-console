/*
 * GovPay - Porta di Accesso al Nodo dei Pagamenti SPC
 * http://www.gov4j.it/govpay
 *
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import { IntermediariConsoleApi } from './intermediari.console-api';
import { IntermediarioFormComponent } from './intermediario-form.component';

function setup(paramId: string | null, api: Partial<IntermediariConsoleApi>) {
  const router = { navigate: vi.fn() };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [IntermediarioFormComponent],
    providers: [
      { provide: IntermediariConsoleApi, useValue: api },
      { provide: SystemFacade, useValue: { setBreadcrumbs: vi.fn() } },
      { provide: SnackbarService, useValue: { error: vi.fn(), success: vi.fn() } },
      { provide: TranslateService, useValue: { instant: (k: string) => k } },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => paramId } } } },
    ],
  });
  TestBed.overrideComponent(IntermediarioFormComponent, { set: { template: '', imports: [] } });
  const comp = TestBed.createComponent(IntermediarioFormComponent).componentInstance;
  return { comp, router };
}

describe('IntermediarioFormComponent', () => {
  it('creazione: form invalido non chiama create; valido sì', () => {
    const create = vi.fn(() => of({ idIntermediario: 'A', denominazione: 'D', principalPagoPa: 'P', abilitato: true }));
    const { comp, router } = setup(null, { create });
    comp.ngOnInit();
    expect(comp.isEdit()).toBe(false);

    comp.save(); // form vuoto → invalido
    expect(create).not.toHaveBeenCalled();

    comp.form.setValue({ idIntermediario: 'INT_A', denominazione: 'Ente', principalPagoPa: 'princ', abilitato: true });
    comp.save();
    expect(create).toHaveBeenCalledWith({
      idIntermediario: 'INT_A',
      denominazione: 'Ente',
      principalPagoPa: 'princ',
      abilitato: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/intermediari', 'INT_A']);
  });

  it('modifica: precompila da getWithETag e fa replace con If-Match', () => {
    const getWithETag = vi.fn(() =>
      of({ body: { idIntermediario: 'INT_A', denominazione: 'Ente', principalPagoPa: 'princ', abilitato: true }, etag: 'W/"7"' })
    );
    const replace = vi.fn(() => of({ body: {} as never, etag: 'W/"8"' }));
    const { comp, router } = setup('INT_A', { getWithETag, replace });
    comp.ngOnInit();

    expect(comp.isEdit()).toBe(true);
    expect(getWithETag).toHaveBeenCalledWith('INT_A');
    expect(comp.form.controls.denominazione.value).toBe('Ente');

    comp.form.patchValue({ denominazione: 'Ente 2' });
    comp.save();
    expect(replace).toHaveBeenCalledWith(
      'INT_A',
      { denominazione: 'Ente 2', principalPagoPa: 'princ', abilitato: true },
      'W/"7"'
    );
    expect(router.navigate).toHaveBeenCalledWith(['/intermediari', 'INT_A']);
  });
});
