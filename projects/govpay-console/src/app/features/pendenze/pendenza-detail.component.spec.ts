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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import { PendenzeConsoleApi } from './pendenze.console-api';
import { PendenzaDetailComponent } from './pendenza-detail.component';
import type { Pendenza, PendenzaLinks, Soggetto } from './pendenza.model';

function pendenza(links: PendenzaLinks): Pendenza {
  return {
    idA2A: 'A2A',
    idPendenza: 'P1',
    stato: 'PAGATA',
    dominio: { idDominio: '12345678901', ragioneSociale: 'Comune X' },
    tipoPendenza: { idTipoPendenza: 'TARI', descrizione: 'TARI' },
    importo: 42,
    causale: 'Causale',
    numeroAvviso: '123456789012345678',
    dataUltimoAggiornamento: '2026-06-30T10:00:00Z',
    voci: [{ idVocePendenza: 'v1', indice: 1, importo: 42, descrizione: 'voce', stato: 'PAGATA' }],
    _links: links,
  };
}

const SOGGETTO: Soggetto = { tipo: 'F', identificativo: 'RSSMRA80A01H501U', anagrafica: 'Mario Rossi' };

const LINKS_FULL: PendenzaLinks = {
  informazioniDebitore: { href: '/x/informazioniDebitore' },
  ricevute: { href: '/x/ricevute' },
  avviso: { href: '/x/avviso' },
};

interface Stubs {
  links?: PendenzaLinks;
  getInformazioniDebitore?: ReturnType<typeof vi.fn>;
  getAvvisoPdf?: ReturnType<typeof vi.fn>;
}

function setup(stubs: Stubs = {}) {
  const links = stubs.links ?? LINKS_FULL;
  const api = {
    get: vi.fn(() => of(pendenza(links))),
    listRicevute: vi.fn(() => of([])),
    getInformazioniDebitore: stubs.getInformazioniDebitore ?? vi.fn(() => of(SOGGETTO)),
    getAvvisoPdf: stubs.getAvvisoPdf ?? vi.fn(() => of(new Blob(['%PDF'], { type: 'application/pdf' }))),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PendenzaDetailComponent],
    providers: [
      { provide: PendenzeConsoleApi, useValue: api },
      { provide: SystemFacade, useValue: { setBreadcrumbs: vi.fn() } },
      { provide: SnackbarService, useValue: { error: vi.fn() } },
      { provide: TranslateService, useValue: { instant: (k: string) => k } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'idA2A' ? 'A2A' : 'P1') } } },
      },
    ],
  });
  TestBed.overrideComponent(PendenzaDetailComponent, { set: { template: '', imports: [] } });
  const comp = TestBed.createComponent(PendenzaDetailComponent).componentInstance;
  return { comp, api };
}

describe('PendenzaDetailComponent', () => {
  it('ngOnInit carica la pendenza e le ricevute', () => {
    const { comp, api } = setup();
    comp.ngOnInit();
    expect(api.get).toHaveBeenCalledWith('A2A', 'P1');
    expect(api.listRicevute).toHaveBeenCalledWith('A2A', 'P1');
    expect(comp.pendenza()?.idPendenza).toBe('P1');
    expect(comp.title()).toBe('123456789012345678');
    expect(comp.statoTone()).toBe('success');
    expect(comp.statoLabelKey()).toBe('Pendenze.Stati.Pagata');
  });

  it('gating _links: avviso e debitore presenti', () => {
    const { comp } = setup();
    comp.ngOnInit();
    expect(comp.hasAvvisoLink()).toBe(true);
    expect(comp.hasDebitoreLink()).toBe(true);
  });

  it('gating _links: avviso assente quando manca il link', () => {
    const { comp } = setup({
      links: { informazioniDebitore: { href: '/x/informazioniDebitore' }, ricevute: { href: '/x/ricevute' } },
    });
    comp.ngOnInit();
    expect(comp.hasAvvisoLink()).toBe(false);
    expect(comp.hasDebitoreLink()).toBe(true);
  });

  it('debitore on-demand: consenso richiesto prima della fetch', () => {
    const getInformazioniDebitore = vi.fn(() => of(SOGGETTO));
    const { comp } = setup({ getInformazioniDebitore });
    comp.ngOnInit();

    comp.onMostraDebitore();
    expect(comp.askConsenso()).toBe(true);
    expect(getInformazioniDebitore).not.toHaveBeenCalled();

    comp.onConsensoConfermato();
    expect(getInformazioniDebitore).toHaveBeenCalledWith('A2A', 'P1');
    expect(comp.askConsenso()).toBe(false);
    expect(comp.debitore()?.anagrafica).toBe('Mario Rossi');
  });

  it('consenso annullato non carica il debitore', () => {
    const getInformazioniDebitore = vi.fn(() => of(SOGGETTO));
    const { comp } = setup({ getInformazioniDebitore });
    comp.ngOnInit();
    comp.onMostraDebitore();
    comp.onConsensoAnnullato();
    expect(comp.askConsenso()).toBe(false);
    expect(getInformazioniDebitore).not.toHaveBeenCalled();
  });

  describe('stampa avviso', () => {
    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => 'blob:mock');
      URL.revokeObjectURL = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });
    afterEach(() => vi.restoreAllMocks());

    it('scarica il PDF via getAvvisoPdf', () => {
      const getAvvisoPdf = vi.fn(() => of(new Blob(['%PDF'], { type: 'application/pdf' })));
      const { comp } = setup({ getAvvisoPdf });
      comp.ngOnInit();
      comp.onStampaAvviso();
      expect(getAvvisoPdf).toHaveBeenCalledWith('A2A', 'P1');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
