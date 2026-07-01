/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { describe, expect, it } from 'vitest';
import {
  computeActiveChips,
  initialSearchState,
  type SearchField,
} from './search-pill.types';

const FIELDS: SearchField[] = [
  { id: 'query', label: 'Ricerca libera', kind: 'text' },
  { id: 'idPendenza', label: 'ID pendenza', kind: 'text' },
  { id: 'idDominio', label: 'Ente creditore', kind: 'select', options: ['', 'A', 'B'] },
  { id: 'stato', label: 'Stato', kind: 'select', options: ['Tutti', 'X'], default: 'Tutti' },
];

describe('initialSearchState', () => {
  it('semina i filtri col default ed esclude la chiave query', () => {
    const s = initialSearchState(FIELDS, 'recent', 'asc');
    expect(s.query).toBe('');
    expect(s.filters).toEqual({ idPendenza: '', idDominio: '', stato: 'Tutti' });
    expect(s.sort).toBe('recent');
    expect(s.dir).toBe('asc');
  });
});

describe('computeActiveChips', () => {
  it('esclude la query libera, i vuoti e i select al default', () => {
    const chips = computeActiveChips(FIELDS, { query: 'ignorata', idPendenza: '', idDominio: '', stato: 'Tutti' });
    expect(chips).toEqual([]);
  });

  it('produce chip anche per i campi text valorizzati', () => {
    const chips = computeActiveChips(FIELDS, { idPendenza: 'xyz', idDominio: '', stato: 'Tutti' });
    expect(chips).toEqual([{ id: 'idPendenza', label: 'ID pendenza', value: 'xyz' }]);
  });

  it('produce chip per select e text con valore diverso dal default', () => {
    const chips = computeActiveChips(FIELDS, { idPendenza: 'xyz', idDominio: 'A', stato: 'X' });
    expect(chips).toEqual([
      { id: 'idPendenza', label: 'ID pendenza', value: 'xyz' },
      { id: 'idDominio', label: 'Ente creditore', value: 'A' },
      { id: 'stato', label: 'Stato', value: 'X' },
    ]);
  });
});
