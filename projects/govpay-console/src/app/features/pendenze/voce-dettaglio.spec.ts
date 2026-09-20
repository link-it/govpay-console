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
import {
  normalizeContabilita,
  normalizeMetadata,
  parseJsonField,
  prettifyKey,
  voceExtra,
} from './voce-dettaglio';
import type { VocePendenza } from './pendenza.model';

function voce(patch: Partial<VocePendenza> = {}): VocePendenza {
  return { idVocePendenza: 'v1', importo: 10, descrizione: 'Voce', stato: 'NON_PAGATA', ...patch };
}

describe('parseJsonField', () => {
  it('stringa vuota/undefined → undefined', () => {
    expect(parseJsonField(undefined)).toBeUndefined();
    expect(parseJsonField('')).toBeUndefined();
    expect(parseJsonField('   ')).toBeUndefined();
  });
  it('JSON valido → oggetto', () => {
    expect(parseJsonField('{"a":1}')).toEqual({ a: 1 });
  });
  it('non-JSON → stringa grezza', () => {
    expect(parseJsonField('non json')).toBe('non json');
  });
});

describe('prettifyKey', () => {
  it('camelCase → parole', () => {
    expect(prettifyKey('annoEsercizio')).toBe('Anno esercizio');
  });
  it('SNAKE_CASE → parole', () => {
    expect(prettifyKey('CODICE_TRIBUTO')).toBe('Codice tributo');
  });
});

describe('normalizeMetadata', () => {
  it('oggetto chiave/valore → coppie con etichette libere', () => {
    const items = normalizeMetadata('{"Codice concorso":"C1","Identificativo iscrizione":"I1"}');
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ labelKey: 'Codice concorso', value: 'C1' });
  });
  it('array di {chiave,valore}', () => {
    const items = normalizeMetadata('[{"chiave":"K","valore":"V"}]');
    expect(items).toEqual([{ labelKey: 'K', value: 'V' }]);
  });
  it('vuoto → []', () => {
    expect(normalizeMetadata(undefined)).toEqual([]);
    expect(normalizeMetadata('')).toEqual([]);
  });
});

describe('normalizeContabilita', () => {
  it('array di quote: tipo come badge + importo eurocent → euro', () => {
    const raw = JSON.stringify([
      { tipoContabilizzazione: 'CORRISPETTIVO_DL118', annoEsercizio: 2026, capitolo: 'CAP1', importo: 2000 },
      { tipoContabilizzazione: 'INCASSO_TIPICO', annoEsercizio: 2026, codiceTributo: 'T1', importo: 2450 },
    ]);
    const cards = normalizeContabilita(raw);
    expect(cards).toHaveLength(2);
    expect(cards[0].tipo).toBe('CORRISPETTIVO_DL118');
    const imp = cards[0].items.find((i) => i.labelKey === 'Pendenze.Voci.Importo');
    expect(imp?.value).toContain('20,00');
    // il tipo non compare tra le righe
    expect(cards[0].items.some((i) => /CORRISPETTIVO/.test(String(i.value)))).toBe(false);
  });
  it('wrapper {quote:[...]}', () => {
    const cards = normalizeContabilita('{"quote":[{"tipo":"X","importo":100}]}');
    expect(cards).toHaveLength(1);
    expect(cards[0].tipo).toBe('X');
    expect(cards[0].items.find((i) => i.labelKey === 'Pendenze.Voci.Importo')?.value).toContain('1,00');
  });
  it('oggetto singolo (SPESE_NOTIFICA)', () => {
    const cards = normalizeContabilita('{"tipo":"SPESE_NOTIFICA SEND","importoNotifica":100}');
    expect(cards).toHaveLength(1);
    expect(cards[0].tipo).toBe('SPESE_NOTIFICA SEND');
    expect(cards[0].items.find((i) => i.labelKey === 'Pendenze.Voci.ImportoNotifica')?.value).toContain('1,00');
  });
});

describe('voceExtra', () => {
  it('voce senza campi opachi → isEmpty', () => {
    expect(voceExtra(voce()).isEmpty).toBe(true);
  });
  it('aggrega dettaglio + metadata + contabilita', () => {
    const v = voce({
      dettaglio: { tipoVoce: 'INCASSO_DIRETTO', ibanAccredito: 'IT60X', tipoContabilita: 'CAPITOLO', codiceContabilita: '3321' },
      metadata: '{"Codice concorso":"C1"}',
      contabilita: '[{"tipoContabilizzazione":"INCASSO_TIPICO","importo":3300}]',
    });
    const extra = voceExtra(v);
    expect(extra.isEmpty).toBe(false);
    expect(extra.datiAggiuntivi.some((i) => i.labelKey === 'Pendenze.Voci.IbanAccredito')).toBe(true);
    expect(extra.metadati).toHaveLength(1);
    expect(extra.contabilita).toHaveLength(1);
  });
});
