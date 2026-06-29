/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import { Injector, signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TweaksRegistry } from './tweaks-registry.service';
import type { TweakSectionDef } from './tweaks-types';

function createRegistry(): TweaksRegistry {
  return Injector.create({ providers: [TweaksRegistry] }).get(TweaksRegistry);
}

function makeSection(id: string, priority?: number, onReset?: () => void): TweakSectionDef {
  return {
    id,
    titleKey: `Tweaks.${id}`,
    rows: [
      {
        type: 'toggle',
        labelKey: 'Tweaks.Test',
        value: signal(false),
        onChange: () => {
          /* no-op */
        },
      },
    ],
    priority,
    onReset,
  };
}

describe('TweaksRegistry', () => {
  let registry: TweaksRegistry;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('default: zero sezioni, open false', () => {
    expect(registry.count()).toBe(0);
    expect(registry.sections()).toEqual([]);
    expect(registry.open()).toBe(false);
  });

  it('register aggiunge la sezione e ritorna la cleanup function', () => {
    const cleanup = registry.register(makeSection('a'));
    expect(registry.count()).toBe(1);
    expect(registry.sections()[0].id).toBe('a');

    cleanup();
    expect(registry.count()).toBe(0);
  });

  it('register con id duplicato sostituisce la sezione (last-write-wins)', () => {
    registry.register(makeSection('a'));
    registry.register({ ...makeSection('a'), titleKey: 'Tweaks.NEW' });
    expect(registry.count()).toBe(1);
    expect(registry.sections()[0].titleKey).toBe('Tweaks.NEW');
  });

  it('sections() ordina per priority decrescente (default 0)', () => {
    registry.register(makeSection('low', 0));
    registry.register(makeSection('high', 10));
    registry.register(makeSection('mid', 5));
    expect(registry.sections().map((s) => s.id)).toEqual(['high', 'mid', 'low']);
  });

  it('unregister(id) rimuove la sezione', () => {
    registry.register(makeSection('a'));
    registry.register(makeSection('b'));
    registry.unregister('a');
    expect(registry.sections().map((s) => s.id)).toEqual(['b']);
  });

  it('unregister di id inesistente è no-op (non fa esplodere)', () => {
    registry.register(makeSection('a'));
    expect(() => registry.unregister('not-there')).not.toThrow();
    expect(registry.count()).toBe(1);
  });

  it('toggle e setOpen pilotano lo stato open', () => {
    expect(registry.open()).toBe(false);
    registry.toggle();
    expect(registry.open()).toBe(true);
    registry.setOpen(false);
    expect(registry.open()).toBe(false);
  });

  it('resetAll invoca onReset di tutte le sezioni registrate', () => {
    const resetA = vi.fn();
    const resetB = vi.fn();
    registry.register(makeSection('a', 0, resetA));
    registry.register(makeSection('b', 0, resetB));
    // Sezione senza onReset: deve essere ignorata silenziosamente.
    registry.register(makeSection('c', 0));

    registry.resetAll();

    expect(resetA).toHaveBeenCalledTimes(1);
    expect(resetB).toHaveBeenCalledTimes(1);
  });
});
