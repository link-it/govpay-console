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
import { sliceHasMore, type Slice } from './slice.model';

describe('sliceHasMore', () => {
  it('offset: segue pagination.hasNextPage', () => {
    const more: Slice<number> = { results: [1, 2], pagination: { page: 1, limit: 2, hasNextPage: true } };
    const last: Slice<number> = { results: [3], pagination: { page: 2, limit: 2, hasNextPage: false } };
    expect(sliceHasMore(more)).toBe(true);
    expect(sliceHasMore(last)).toBe(false);
  });

  it('cursor: true finché nextCursor è presente', () => {
    const more: Slice<number> = { results: [1, 2], nextCursor: 'abc' };
    const last: Slice<number> = { results: [3] };
    expect(sliceHasMore(more)).toBe(true);
    expect(sliceHasMore(last)).toBe(false);
  });

  it('gestisce null/undefined e slice senza metadati', () => {
    expect(sliceHasMore(null)).toBe(false);
    expect(sliceHasMore(undefined)).toBe(false);
    expect(sliceHasMore({ results: [] })).toBe(false);
  });
});
