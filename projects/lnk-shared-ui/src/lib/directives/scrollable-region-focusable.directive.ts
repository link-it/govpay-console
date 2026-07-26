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

import { Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';

/**
 * `[lnkScrollableRegionFocusable]` — rende un contenitore scrollabile
 * raggiungibile da tastiera. Quando l'elemento ha overflow effettivo
 * (`scrollWidth/Height > clientWidth/Height`) gli imposta `tabindex="0"`, così
 * chi naviga da tastiera può mettere a fuoco l'area e scorrerla con le frecce
 * (WCAG 2.1.1 Keyboard; axe `scrollable-region-focusable`). Quando il contenuto
 * ci sta senza scroll, il `tabindex` viene rimosso (niente focus-stop inutile).
 *
 * Ricalcola su resize dell'elemento (`ResizeObserver`) e su cambi di contenuto
 * (`MutationObserver`, utile con testo interpolato). SSR-safe.
 *
 * ```html
 * <pre lnkScrollableRegionFocusable class="overflow-x-auto ...">{{ json }}</pre>
 * ```
 */
@Directive({
  selector: '[lnkScrollableRegionFocusable]',
  standalone: true,
})
export class ScrollableRegionFocusableDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private ro?: ResizeObserver;
  private mo?: MutationObserver;

  constructor() {
    afterNextRender(() => {
      this.update();
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.update());
        this.ro.observe(this.el.nativeElement);
      }
      if (typeof MutationObserver !== 'undefined') {
        this.mo = new MutationObserver(() => this.update());
        this.mo.observe(this.el.nativeElement, { childList: true, characterData: true, subtree: true });
      }
    });
  }

  private update(): void {
    const el = this.el.nativeElement;
    // +1 di tolleranza per arrotondamenti sub-pixel.
    const scrollable = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
    if (scrollable) {
      if (el.getAttribute('tabindex') !== '0') el.setAttribute('tabindex', '0');
    } else if (el.getAttribute('tabindex') === '0') {
      el.removeAttribute('tabindex');
    }
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    this.mo?.disconnect();
  }
}
