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

import { DOCUMENT, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, afterNextRender, inject, signal } from '@angular/core';

/**
 * Barra delle azioni di una form (salva / annulla) **sticky in basso**: resta
 * ancorata al fondo del viewport mentre la form scrolla, così i pulsanti sono
 * sempre raggiungibili. Si posiziona come ultimo figlio del contenitore `.px-6`
 * di una pagina form ed estende sfondo e bordo a tutta la larghezza del
 * contenuto (`-mx-6 px-6`).
 *
 * Lo `sticky` è sull'host (non su un div interno): così il *containing block*
 * del box sticky è il `<form>` alto, che gli dà lo spazio per restare ancorato.
 * Bordo e ombra compaiono **solo quando la barra è effettivamente incollata**
 * (classe `.lnk-form-action-bar--stuck`), non quando riposa a fine pagina.
 *
 * ```html
 * <form ...>
 *   … campi …
 *   <lnk-form-action-bar>
 *     <button type="submit" class="btn btn-primary btn-sm">Salva</button>
 *     <a [routerLink]="backLink()" class="btn btn-ghost btn-sm">Annulla</a>
 *   </lnk-form-action-bar>
 * </form>
 * ```
 */
@Component({
  selector: 'lnk-form-action-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lnk-form-action-bar sticky bottom-0 z-20 -mx-6 mt-2 flex items-center gap-2 bg-[var(--background)] px-6 py-3',
    '[class.lnk-form-action-bar--stuck]': 'stuck()',
  },
  template: `<ng-content />`,
})
export class FormActionBarComponent implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private ro?: ResizeObserver;

  /** True quando la barra è ancorata (fluttua sul contenuto), non a riposo. */
  protected readonly stuck = signal(false);

  constructor() {
    afterNextRender(() => {
      this.recompute();
      if (typeof ResizeObserver !== 'undefined') {
        // Ricalcola quando cambia l'altezza del documento (switch di tab,
        // espansione di un code-field, ecc.), non solo allo scroll.
        this.ro = new ResizeObserver(() => this.recompute());
        this.ro.observe(this.doc.body);
      }
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.recompute();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.recompute();
  }

  private recompute(): void {
    const view = this.doc.defaultView;
    if (!view) return;
    // "Incollata" = il bordo inferiore della barra tocca il fondo del viewport
    // (è tenuta lì dallo sticky). A riposo — pagina corta o scroll a fondo — il
    // bordo inferiore risale sopra il fondo del viewport.
    const rect = this.el.nativeElement.getBoundingClientRect();
    const next = rect.bottom >= view.innerHeight - 1;
    if (next !== this.stuck()) this.stuck.set(next);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }
}
