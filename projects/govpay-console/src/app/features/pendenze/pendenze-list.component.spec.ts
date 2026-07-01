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
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  ConfigService,
  DisplayConfigLoader,
  ListStateService,
  SnackbarService,
  SystemFacade,
  TweaksRegistry,
} from '@linkit/shared-ui';
import { AuthService } from '@core/auth/services/auth.service';
import type { Slice } from '@core/models';
import { PendenzeConsoleApi } from './pendenze.console-api';
import { PendenzeListComponent } from './pendenze-list.component';
import type { PendenzaSummary } from './pendenza.model';

function summary(idPendenza: string): PendenzaSummary {
  return {
    idA2A: 'A2A',
    idPendenza,
    stato: 'NON_PAGATA',
    dominio: { idDominio: '12345678901', ragioneSociale: 'Comune X' },
    tipoPendenza: { idTipoPendenza: 'TARI', descrizione: 'TARI' },
    importo: 10,
    causale: 'c',
    dataUltimoAggiornamento: '2026-06-30T10:00:00Z',
  };
}

function slice(
  results: PendenzaSummary[],
  hasNextPage = false,
  totalResults?: number,
): Slice<PendenzaSummary> {
  return { results, pagination: { page: 1, limit: 25, hasNextPage, totalResults } };
}

interface Stubs {
  list?: ReturnType<typeof vi.fn>;
}

function setup(stubs: Stubs = {}) {
  const apiList = stubs.list ?? vi.fn(() => of(slice([summary('1')], false, 1)));
  const snackbarError = vi.fn();
  const listStateSet = vi.fn();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PendenzeListComponent],
    providers: [
      { provide: PendenzeConsoleApi, useValue: { list: apiList } },
      { provide: ConfigService, useValue: { appConfig: () => ({ Layout: {} }) } },
      { provide: SystemFacade, useValue: { setBreadcrumbs: vi.fn() } },
      { provide: ListStateService, useValue: { get: () => null, set: listStateSet } },
      { provide: SnackbarService, useValue: { error: snackbarError } },
      { provide: TranslateService, useValue: { instant: (k: string) => k } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      {
        provide: AuthService,
        useValue: {
          user: () => ({
            domini: [
              { idDominio: '*', ragioneSociale: 'Tutti' },
              { idDominio: '12345678901', ragioneSociale: 'Comune X' },
            ],
          }),
        },
      },
      { provide: DisplayConfigLoader, useValue: { load: () => of(null) } },
      { provide: TweaksRegistry, useValue: { register: () => () => {} } },
    ],
  });
  TestBed.overrideComponent(PendenzeListComponent, { set: { template: '', imports: [] } });
  const comp = TestBed.createComponent(PendenzeListComponent).componentInstance;
  return { comp, apiList, snackbarError };
}

describe('PendenzeListComponent', () => {
  it('dominiOptions esclude il placeholder "*"', () => {
    const { comp } = setup();
    expect(comp.dominiOptions()).toEqual([{ value: '12345678901', label: 'Comune X' }]);
  });

  it('ngOnInit carica con i parametri V2 di default (page/limit/sort/total)', () => {
    const { comp, apiList } = setup();
    comp.ngOnInit();
    expect(apiList).toHaveBeenCalledWith({
      page: 1,
      limit: 25,
      sort: '-dataUltimoAggiornamento',
      total: true,
      idPendenza: undefined,
      numeroAvviso: undefined,
      idDominio: undefined,
      identificativoDebitore: undefined,
    });
    expect(comp.rows().length).toBe(1);
    expect(comp.hasMore()).toBe(false);
    expect(comp.total()).toBe(1);
  });

  it('hasMore riflette pagination.hasNextPage', () => {
    const { comp } = setup({ list: vi.fn(() => of(slice([summary('1')], true))) });
    comp.ngOnInit();
    expect(comp.hasMore()).toBe(true);
    expect(comp.canLoadMore()).toBe(true);
  });

  it('un filtro dedicato viene inoltrato come query param', () => {
    const { comp, apiList } = setup();
    comp.ngOnInit();
    apiList.mockClear();
    comp.onNumeroAvvisoChange('123456789012345678');
    expect(comp.hasActiveFilters()).toBe(true);
    expect(apiList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, numeroAvviso: '123456789012345678' })
    );
  });

  it('loadMore accoda la pagina successiva senza richiedere di nuovo il totale', () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(of(slice([summary('1')], true, 2)))
      .mockReturnValueOnce(of(slice([summary('2')], false)));
    const { comp } = setup({ list });
    comp.ngOnInit();
    expect(comp.rows().length).toBe(1);
    expect(comp.total()).toBe(2);
    comp.loadMore();
    expect(comp.rows().map((r) => r.idPendenza)).toEqual(['1', '2']);
    expect(comp.hasMore()).toBe(false);
    // Prima pagina con total=true, append con total=undefined.
    expect(list.mock.calls[0][0]).toMatchObject({ page: 1, total: true });
    expect(list.mock.calls[1][0]).toMatchObject({ page: 2, total: undefined });
    // Il totale resta quello della prima pagina.
    expect(comp.total()).toBe(2);
  });

  it('in errore imposta error e mostra snackbar (RFC 7807 fallback)', () => {
    const { comp, snackbarError } = setup({ list: vi.fn(() => throwError(() => new Error('boom'))) });
    comp.ngOnInit();
    expect(comp.hasError()).toBe(true);
    expect(snackbarError).toHaveBeenCalled();
    expect(comp.rows().length).toBe(0);
  });
});
