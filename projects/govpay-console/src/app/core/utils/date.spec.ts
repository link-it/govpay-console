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
import { dayToIso } from './date';

describe('dayToIso', () => {
  it('ritorna un ISO 8601 completo (RFC 3339) senza millisecondi', () => {
    const iso = dayToIso('2026-08-24', false);
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(iso).not.toContain('.');
  });

  it('inizio e fine giornata mappano lo stesso giorno locale su istanti distinti', () => {
    const start = dayToIso('2026-08-24', false)!;
    const end = dayToIso('2026-08-24', true)!;
    expect(new Date(end).getTime()).toBeGreaterThan(new Date(start).getTime());
    // La differenza copre ~un giorno intero (23:59:59 vs 00:00:00).
    expect(new Date(end).getTime() - new Date(start).getTime()).toBe(((23 * 60 + 59) * 60 + 59) * 1000);
  });

  it('ritorna undefined per date vuote o malformate', () => {
    expect(dayToIso('', false)).toBeUndefined();
    expect(dayToIso(undefined, false)).toBeUndefined();
    expect(dayToIso(null, true)).toBeUndefined();
    expect(dayToIso('non-una-data', false)).toBeUndefined();
  });
});
