/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Subject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewDataPoller } from './list-new-data-poller';

describe('createNewDataPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('start(): schedula fetch ad ogni intervalMs', () => {
    const fetch = vi.fn(() => of(100));
    const poller = createNewDataPoller({ fetch, intervalMs: 1000 });

    poller.start();
    expect(fetch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(fetch).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2000);
    expect(fetch).toHaveBeenCalledTimes(3);

    poller.stop();
  });

  it('primo fetch (initialTotal=undefined): stabilisce baseline, count=0', () => {
    const fetch = vi.fn(() => of(100));
    const poller = createNewDataPoller({ fetch, intervalMs: 1000 });

    poller.start();
    vi.advanceTimersByTime(1000);
    expect(poller.count()).toBe(0);

    poller.stop();
  });

  it('secondo fetch con total > baseline: count = delta', () => {
    const subject = new Subject<number>();
    const poller = createNewDataPoller({ fetch: () => subject, intervalMs: 1000 });
    poller.start();

    vi.advanceTimersByTime(1000);
    subject.next(100); // baseline = 100

    vi.advanceTimersByTime(1000);
    subject.next(105); // delta = 5
    expect(poller.count()).toBe(5);

    poller.stop();
  });

  it('total === baseline: count invariato', () => {
    const subject = new Subject<number>();
    const poller = createNewDataPoller({ fetch: () => subject, intervalMs: 1000 });
    poller.start();

    vi.advanceTimersByTime(1000);
    subject.next(50);

    vi.advanceTimersByTime(1000);
    subject.next(50);
    expect(poller.count()).toBe(0);

    poller.stop();
  });

  it('total < baseline: count NON va negativo (resta invariato)', () => {
    const subject = new Subject<number>();
    const poller = createNewDataPoller({ fetch: () => subject, intervalMs: 1000 });
    poller.start();

    vi.advanceTimersByTime(1000);
    subject.next(100);

    vi.advanceTimersByTime(1000);
    subject.next(80); // delta = -20, ignorato
    expect(poller.count()).toBe(0);

    poller.stop();
  });

  it('initialTotal valorizzato: baseline iniziale, primo fetch confronta subito', () => {
    const subject = new Subject<number>();
    const poller = createNewDataPoller({
      fetch: () => subject,
      intervalMs: 1000,
      initialTotal: 50,
    });
    poller.start();

    vi.advanceTimersByTime(1000);
    subject.next(53);
    expect(poller.count()).toBe(3);

    poller.stop();
  });

  it('reset(): azzera count, mantiene baseline', () => {
    const subject = new Subject<number>();
    const poller = createNewDataPoller({ fetch: () => subject, intervalMs: 1000 });
    poller.start();

    vi.advanceTimersByTime(1000);
    subject.next(100); // baseline

    vi.advanceTimersByTime(1000);
    subject.next(110); // delta 10
    expect(poller.count()).toBe(10);

    poller.reset();
    expect(poller.count()).toBe(0);

    // Senza nuovo baseline esplicito, il prossimo fetch sara`
    // comparato con baseline=100 → 110-100=10 (NON 0). Il consumer
    // dovrebbe passare il nuovo total a `reset(newBaseline)` dopo
    // un refresh manuale.
    vi.advanceTimersByTime(1000);
    subject.next(110);
    expect(poller.count()).toBe(10);

    poller.stop();
  });

  it('reset(newBaseline): azzera count e aggiorna baseline', () => {
    const subject = new Subject<number>();
    const poller = createNewDataPoller({ fetch: () => subject, intervalMs: 1000 });
    poller.start();

    vi.advanceTimersByTime(1000);
    subject.next(100);

    poller.reset(110);
    expect(poller.count()).toBe(0);

    vi.advanceTimersByTime(1000);
    subject.next(110);
    expect(poller.count()).toBe(0); // total === nuova baseline

    vi.advanceTimersByTime(1000);
    subject.next(115);
    expect(poller.count()).toBe(5);

    poller.stop();
  });

  it('stop(): cancella la subscription, nessuna chiamata fetch successiva', () => {
    const fetch = vi.fn(() => of(100));
    const poller = createNewDataPoller({ fetch, intervalMs: 1000 });

    poller.start();
    vi.advanceTimersByTime(2000);
    expect(fetch).toHaveBeenCalledTimes(2);

    poller.stop();
    vi.advanceTimersByTime(5000);
    expect(fetch).toHaveBeenCalledTimes(2); // invariato
  });

  it('start() idempotente: chiamate multiple non duplicano subscription', () => {
    const fetch = vi.fn(() => of(100));
    const poller = createNewDataPoller({ fetch, intervalMs: 1000 });

    poller.start();
    poller.start();
    poller.start();

    vi.advanceTimersByTime(1000);
    expect(fetch).toHaveBeenCalledTimes(1); // 1, non 3

    poller.stop();
  });

  it('start() dopo stop() ricrea la subscription', () => {
    const fetch = vi.fn(() => of(100));
    const poller = createNewDataPoller({ fetch, intervalMs: 1000 });

    poller.start();
    vi.advanceTimersByTime(1000);
    expect(fetch).toHaveBeenCalledTimes(1);

    poller.stop();
    vi.advanceTimersByTime(2000);
    expect(fetch).toHaveBeenCalledTimes(1);

    poller.start();
    vi.advanceTimersByTime(1000);
    expect(fetch).toHaveBeenCalledTimes(2);

    poller.stop();
  });
});
