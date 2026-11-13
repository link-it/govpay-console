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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import { GiornaleEventiConsoleApi } from './giornale-eventi.console-api';
import { EventiTimelineComponent } from './eventi-timeline.component';
import type { Evento, EventoListFilters, EventoSummary } from './evento.model';

const SUMMARY: EventoSummary = {
  id: 7,
  dataEvento: '2026-06-30T10:00:00Z',
  durataEventoMs: 120,
  componente: 'API_PAGOPA',
  categoriaEvento: 'INTERFACCIA',
  tipoEvento: 'nodoInviaRPT',
  sottotipoEsito: '0',
  esito: 'OK',
  transactionId: 'tx-1',
};

const DETTAGLIO: Evento = {
  ...SUMMARY,
  dimensioneRichiesta: 2048,
  dimensioneRisposta: 512,
  _links: { self: { href: '/eventi/7' }, richiesta: { href: '/eventi/7/richiesta' }, risposta: { href: '/eventi/7/risposta' } },
};

function setup(
  events: EventoSummary[] = [SUMMARY],
  filters: EventoListFilters = { idA2A: 'A2A', idPendenza: 'P1' },
) {
  const api = {
    list: vi.fn(() => of({ results: events, pagination: { hasNextPage: false } })),
    get: vi.fn(() => of(DETTAGLIO)),
    getRichiesta: vi.fn(() => of({ headers: [{ nome: 'Content-Type', valore: 'text/xml' }], payload: '<rpt/>' })),
    getRisposta: vi.fn(() => of({ headers: [], payload: undefined })),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [EventiTimelineComponent],
    providers: [
      { provide: GiornaleEventiConsoleApi, useValue: api },
      { provide: SnackbarService, useValue: { error: vi.fn() } },
      { provide: TranslateService, useValue: { instant: (k: string) => k } },
    ],
  });
  TestBed.overrideComponent(EventiTimelineComponent, { set: { template: '', imports: [] } });
  const fixture = TestBed.createComponent(EventiTimelineComponent);
  fixture.componentRef.setInput('filters', filters);
  const comp = fixture.componentInstance;
  return { comp, fixture, api };
}

describe('EventiTimelineComponent', () => {
  beforeEach(() => setup());

  it('carica gli eventi al boot e ne emette il conteggio', () => {
    const { comp, fixture, api } = setup([SUMMARY, { ...SUMMARY, id: 8 }]);
    const counts: number[] = [];
    comp.count.subscribe((n) => counts.push(n));
    fixture.detectChanges(); // ngOnInit → fetch
    expect(api.list).toHaveBeenCalledWith({ idA2A: 'A2A', idPendenza: 'P1', limit: 100 });
    expect(comp.events().length).toBe(2);
    expect(comp.loading()).toBe(false);
    expect(counts.at(-1)).toBe(2);
  });

  it('contesto ricevuta: filtra per la tupla RT (idDominio, iuv, ccp)', () => {
    const { fixture, api } = setup([SUMMARY], { idDominio: '01234567890', iuv: 'RF123', ccp: 'R1' });
    fixture.detectChanges();
    expect(api.list).toHaveBeenCalledWith({ idDominio: '01234567890', iuv: 'RF123', ccp: 'R1', limit: 100 });
  });

  it('toggle espande la riga e carica il dettaglio (_links) una sola volta', () => {
    const { comp, fixture, api } = setup();
    fixture.detectChanges();
    expect(comp.isOpen(7)).toBe(false);
    comp.toggle(SUMMARY);
    expect(comp.isOpen(7)).toBe(true);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(comp.hasRichiesta(7)).toBe(true);
    expect(comp.hasRisposta(7)).toBe(true);
    // Richiudi e riapri: nessuna nuova get (già in cache).
    comp.toggle(SUMMARY);
    comp.toggle(SUMMARY);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("esitoTone/dotColor derivano dal colore dell'esito", () => {
    const { comp } = setup();
    expect(comp.esitoTone(SUMMARY)).toBe('success');
    expect(comp.esitoTone({ ...SUMMARY, esito: 'KO' })).toBe('warning');
    expect(comp.esitoTone({ ...SUMMARY, esito: 'FAIL' })).toBe('danger');
    expect(comp.dotColor(SUMMARY)).toBe('var(--status-success-text)');
  });

  it('formatDim rende byte/KB (e stringa vuota se assente)', () => {
    const { comp } = setup();
    expect(comp.formatDim(undefined)).toBe('');
    expect(comp.formatDim(512)).toBe('512 B');
    expect(comp.formatDim(2048)).toBe('2.0 KB');
  });

  it('download richiesta scrive header + payload come .txt', () => {
    const { comp, fixture, api } = setup();
    fixture.detectChanges();
    const spy = vi.fn();
    // downloadBlob è importato dalla lib; verifichiamo l'effetto tramite anchor click.
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:x') as unknown as typeof URL.createObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(spy);
    comp.onDownloadRichiesta(7);
    expect(api.getRichiesta).toHaveBeenCalledWith(7);
    expect(spy).toHaveBeenCalled();
    expect(comp.downloading()).toBeNull();
    clickSpy.mockRestore();
    URL.createObjectURL = origCreate;
  });
});
