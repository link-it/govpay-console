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

import { describe, expect, it } from 'vitest';
import { normalizeRpt, normalizeRt, type RptDettaglio, type RtDettaglio } from './ricevuta.model';

describe('normalizeRt', () => {
  it('schema flat (inglese)', () => {
    const rt: RtDettaglio = {
      receiptId: 'R1',
      outcome: 'OK',
      paymentAmount: '100.99',
      fee: '1.00',
      paymentMethod: 'bancomat',
      companyName: 'Consap',
      fiscalCode: '04570621005',
      creditorReferenceId: '01000000000020663',
      description: 'Iscrizione',
      debtor: { fullName: 'Giulia Ferretti', uniqueIdentifier: { entityUniqueIdentifierType: 'F', entityUniqueIdentifierValue: 'FRRGLI85M41H501K' }, 'e-mail': 'g@x.it' },
      PSPCompanyName: 'Banco di Ponzi S.p.A.',
      pspFiscalCode: '22222222222',
      idChannel: 'GovPAYPsp1_PO',
      channelDescription: 'PO',
      transferList: { transfer: [{ idTransfer: 1, transferAmount: '100.99', IBAN: 'IT02', remittanceInformation: '/RFB/…' }] },
    };
    const v = normalizeRt(rt, null, 'GovPAYPsp1');
    expect(v.esito).toBe('OK');
    expect(v.importoPagato).toBe('100.99');
    expect(v.commissione).toBe('1.00');
    expect(v.metodoPagamento).toBe('bancomat');
    expect(v.versanteNome).toBe('Giulia Ferretti');
    expect(v.versanteTipo).toBe('F');
    expect(v.versanteEmail).toBe('g@x.it');
    expect(v.enteNome).toBe('Consap');
    expect(v.pspNome).toBe('Banco di Ponzi S.p.A.');
    expect(v.canale).toBe('GovPAYPsp1_PO — PO');
    expect(v.transfers).toEqual([{ num: 1, importo: '100.99', iban: 'IT02', causale: '/RFB/…' }]);
  });

  it('schema verboso (italiano) + IBAN recuperato dalla RPT per indice', () => {
    const rt: RtDettaglio = {
      identificativoMessaggioRicevuta: 'MSG1',
      dataOraMessaggioRicevuta: '2022-07-06T13:39:12',
      istitutoAttestante: { denominazioneAttestante: 'Banco di Ponzi S.p.A.', identificativoUnivocoAttestante: { tipoIdentificativoUnivoco: 'A', codiceIdentificativoUnivoco: '99999' } },
      enteBeneficiario: { denominazioneBeneficiario: 'Fondazione Ugo Bordoni', identificativoUnivocoBeneficiario: { tipoIdentificativoUnivoco: 'G', codiceIdentificativoUnivoco: '97201200587' } },
      soggettoPagatore: { anagraficaPagatore: 'Test User', identificativoUnivocoPagatore: { tipoIdentificativoUnivoco: 'F', codiceIdentificativoUnivoco: 'TSTUSR00A01H501E' } },
      datiPagamento: {
        codiceEsitoPagamento: '0',
        importoTotalePagato: '1000.00',
        identificativoUnivocoVersamento: '01000000000021067',
        datiSingoloPagamento: [{ singoloImportoPagato: '1000.00', dataEsitoSingoloPagamento: '2022-07-06', causaleVersamento: '/RFB/…test' }],
      },
    };
    const rpt: RptDettaglio = { datiVersamento: { datiSingoloVersamento: [{ importoSingoloVersamento: '1000.00', ibanAccredito: 'IT12L0760100000123450000012' }] } };
    const v = normalizeRt(rt, rpt, 'AGID_01');
    expect(v.esito).toBe('OK'); // codiceEsitoPagamento '0'
    expect(v.importoPagato).toBe('1000.00');
    expect(v.commissione).toBeUndefined(); // nessuna fee nello schema verboso
    expect(v.dataOraPagamento).toBe('2022-07-06T13:39:12');
    expect(v.receiptId).toBe('MSG1');
    expect(v.versanteNome).toBe('Test User');
    expect(v.versanteTipo).toBe('F');
    expect(v.enteNome).toBe('Fondazione Ugo Bordoni');
    expect(v.enteCf).toBe('97201200587');
    expect(v.iuv).toBe('01000000000021067');
    expect(v.pspNome).toBe('Banco di Ponzi S.p.A.');
    expect(v.pspCf).toBe('99999');
    expect(v.pspId).toBe('AGID_01'); // fallback a codPsp
    expect(v.transfers).toEqual([{ num: 1, importo: '1000.00', iban: 'IT12L0760100000123450000012', causale: '/RFB/…test' }]);
  });
});

describe('normalizeRpt', () => {
  it('schema verboso (italiano)', () => {
    const rpt: RptDettaglio = {
      datiVersamento: {
        dataEsecuzionePagamento: '2022-07-06',
        importoTotaleDaVersare: '1000.00',
        tipoVersamento: 'BBT',
        identificativoUnivocoVersamento: '01000000000021067',
        datiSingoloVersamento: [{ importoSingoloVersamento: '1000.00', causaleVersamento: '/RFB/…test' }],
      },
    };
    const v = normalizeRpt(rpt);
    expect(v.importoRichiesto).toBe('1000.00');
    expect(v.dataEsecuzione).toBe('2022-07-06');
    expect(v.tipoVersamento).toBe('BBT');
    expect(v.scadenza).toBeUndefined();
    expect(v.iuv).toBe('01000000000021067');
    expect(v.causale).toBe('/RFB/…test');
  });

  it('schema flat (inglese)', () => {
    const rpt: RptDettaglio = { paymentAmount: '100.99', dueDate: '2027-01-12', lastPayment: true, creditorReferenceId: '01000000000020663', description: 'Iscrizione' };
    const v = normalizeRpt(rpt);
    expect(v.importoRichiesto).toBe('100.99');
    expect(v.scadenza).toBe('2027-01-12');
    expect(v.ultimoPagamento).toBe(true);
    expect(v.iuv).toBe('01000000000020663');
  });
});
