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
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Direttiva per scroll infinito basata su `IntersectionObserver`.
 *
 * Va applicata a un elemento "sentinel" posto in fondo alla lista. Quando il
 * sentinel entra nel viewport (con un `rootMargin` opzionale di pre-caricamento),
 * la direttiva emette `(scrolled)` e il componente carica la pagina successiva.
 *
 *   <div class="lista">
 *     ...rows...
 *   </div>
 *   <div lnkInfiniteScroll
 *        [enabled]="hasMore() && !loading()"
 *        rootMargin="400px"
 *        (scrolled)="loadMore()">
 *   </div>
 *
 * - `enabled` controlla se l'observer è attivo: passare `false` quando non c'è
 *   più nulla da caricare o mentre una richiesta è in corso, così evitiamo
 *   trigger duplicati.
 * - `rootMargin` espande l'area di intersection (default `200px`): caricamento
 *   pre-emptivo prima che l'utente raggiunga il fondo.
 * - L'observer ha come `root` il viewport (window) — coerente con lo scroll
 *   a livello body dell'app (vedi `html, body { min-height: 100% }`).
 */
@Directive({
  selector: '[lnkInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly enabled = input<boolean>(true);
  readonly rootMargin = input<string>('200px');

  readonly scrolled = output<void>();

  private observer: IntersectionObserver | null = null;

  constructor() {
    // Ricrea l'observer quando cambia `rootMargin` o `enabled`.
    effect(() => {
      const enabled = this.enabled();
      const margin = this.rootMargin();
      this.disconnect();
      if (enabled) this.connect(margin);
    });

    this.destroyRef.onDestroy(() => this.disconnect());
  }

  private connect(rootMargin: string): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) this.scrolled.emit();
      },
      { rootMargin }
    );
    this.observer.observe(this.el.nativeElement);
  }

  private disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
