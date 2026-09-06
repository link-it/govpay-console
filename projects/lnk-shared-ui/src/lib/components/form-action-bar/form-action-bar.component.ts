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

import { DOCUMENT, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, afterNextRender, inject, signal } from '@angular/core';

/**
 * `<lnk-form-action-bar>` — barra delle azioni di una form (salva / annulla)
 * **sticky in basso**: resta ancorata al fondo del viewport mentre la form
 * scorre, così i pulsanti sono sempre raggiungibili. Va posizionata come ultimo
 * figlio del contenitore della form ed estende sfondo e bordo a tutta la
 * larghezza del contenuto.
 *
 * Lo `sticky` è sull'host (non su un div interno): così il *containing block*
 * del box sticky è il `<form>` alto, che gli dà lo spazio per restare ancorato.
 * Bordo e ombra compaiono **solo quando la barra è effettivamente incollata**
 * (classe `.lnk-form-action-bar--stuck`), non quando riposa a fine pagina.
 *
 * L'inset orizzontale con cui sfondo/bordo sbordano fino ai lati del contenuto
 * è configurabile via la CSS var **`--lnk-action-bar-inset`** (default `1.5rem`,
 * pari a un contenitore con padding orizzontale `1.5rem`).
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
    class: 'lnk-form-action-bar',
    '[class.lnk-form-action-bar--stuck]': 'stuck()',
  },
  template: `<ng-content />`,
  styles: [`
    :host {
      /* Inset orizzontale (override dal consumer se il contenitore ha padding diverso). */
      --lnk-action-bar-inset: 1.5rem;
      /* Ombra "a riposo" e in dark: valore risolto in base al contesto, applicato solo su --stuck. */
      --lnk-action-bar-shadow: 0 -1px 0 var(--border), 0 -6px 16px -12px rgba(0, 0, 0, 0.25);
      position: sticky;
      bottom: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      margin-inline: calc(-1 * var(--lnk-action-bar-inset));
      padding-block: 0.75rem;
      padding-inline: var(--lnk-action-bar-inset);
      background: var(--background, var(--card-bg));
    }

    :host-context(.dark) {
      --lnk-action-bar-shadow: 0 -1px 0 var(--border), 0 -6px 16px -10px rgba(0, 0, 0, 0.6);
    }

    /* Bordo superiore (hairline via box-shadow, non sposta il layout) + lieve
       ombra verso l'alto SOLO quando la barra è incollata al fondo. */
    :host(.lnk-form-action-bar--stuck) {
      box-shadow: var(--lnk-action-bar-shadow);
    }
  `],
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
        // espansione di un editor, ecc.), non solo allo scroll.
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
