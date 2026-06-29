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

import {
  DOCUMENT,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

/**
 * Toolbar sticky in cima alle pagine lista (page-header + filtri).
 * L'host element resta fisso sotto `<lnk-header-bar>` (offset
 * `var(--header-height)`) durante lo scroll del body.
 *
 * - Pubblica la propria altezza in `--lnk-list-toolbar-h` su `<html>`
 *   così che `<lnk-data-table>` possa rendere l'header di tabella sticky
 *   proprio sotto la toolbar.
 * - Aggiunge la classe `shadow-md` quando è effettivamente "incollata"
 *   in cima (per dare una separazione visiva senza border permanente).
 */
const SCROLL_THRESHOLD = 8;

@Directive({
  selector: '[lnkListStickyToolbar]',
  standalone: true,
  host: {
    class: 'sticky top-[var(--header-height)] z-30 bg-[var(--background)] transition-shadow duration-150',
    '[class.lnk-toolbar-stuck]': 'stuck()',
  },
})
export class ListStickyToolbarDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private ro?: ResizeObserver;

  protected readonly stuck = signal(false);

  constructor() {
    afterNextRender(() => {
      const root = this.doc.documentElement;
      const update = () => {
        const h = this.el.nativeElement.offsetHeight;
        root.style.setProperty('--lnk-list-toolbar-h', `${h}px`);
      };
      update();
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(update);
        this.ro.observe(this.el.nativeElement);
      }
      this.recomputeStuck();
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.recomputeStuck();
  }

  private recomputeStuck(): void {
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    const next = y > SCROLL_THRESHOLD;
    if (next !== this.stuck()) this.stuck.set(next);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    this.doc.documentElement.style.removeProperty('--lnk-list-toolbar-h');
  }
}
