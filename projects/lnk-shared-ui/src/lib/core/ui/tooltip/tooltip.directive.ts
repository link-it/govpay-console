/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 */

import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewContainerRef,
  inject,
  input,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LnkTooltipComponent, LnkTooltipVariant } from './tooltip.component';

export type LnkTooltipPosition = 'above' | 'below' | 'left' | 'right';
export type { LnkTooltipVariant };

/**
 * Directive `[lnkTooltip]` basata su CDK Overlay.
 *
 * Alternativa portable a `MatTooltipModule`: stessa accessibilità,
 * stesso auto-positioning, ma con classi Tailwind theming-aware e
 * dipendenza solo da `@angular/cdk` (no `@angular/material`).
 *
 * Esempio:
 * ```html
 * <button [lnkTooltip]="'Salva le modifiche'" lnkTooltipPosition="above">Salva</button>
 * <span [lnkTooltip]="'Attenzione!'" lnkTooltipVariant="warning">!</span>
 * <i [lnkTooltip]="'Info'"
 *    lnkTooltipVariant="custom"
 *    lnkTooltipClass="bg-purple-600 text-white">i</i>
 * ```
 *
 * - Mostra il tooltip dopo `lnkTooltipDelay` ms su mouseenter / focus
 * - Nasconde su mouseleave / blur / Escape
 * - Auto-posizionamento (flip) se non c'è spazio nella posizione richiesta
 * - Aggiunge `aria-describedby` sull'host per accessibilità
 * - Se il testo è vuoto / null la directive resta inerte
 *
 * Varianti supportate via `lnkTooltipVariant`:
 *   - `default` (zinc scuro)
 *   - `info`    (blu)
 *   - `warning` (ambra)
 *   - `custom`  (usa `lnkTooltipClass` per fornire classi Tailwind arbitrarie)
 */
@Directive({
  selector: '[lnkTooltip]',
  standalone: true,
})
export class LnkTooltipDirective implements OnDestroy {
  readonly text = input<string | null | undefined>('', { alias: 'lnkTooltip' });
  readonly position = input<LnkTooltipPosition>('above', { alias: 'lnkTooltipPosition' });
  readonly delay = input<number>(300, { alias: 'lnkTooltipDelay' });
  readonly variant = input<LnkTooltipVariant>('default', { alias: 'lnkTooltipVariant' });
  /** Classi Tailwind aggiuntive — usate quando `variant === 'custom'`. */
  readonly customClass = input<string>('', { alias: 'lnkTooltipClass' });
  /**
   * Disabilita la directive: niente show su mouseenter/focus, niente
   * overlay creato. Utile per disattivare il tooltip in stati specifici
   * (es. dropdown aperto, item disabilitato, ecc.) senza dover rimuovere
   * la directive dal template.
   */
  readonly disabled = input<boolean>(false, { alias: 'lnkTooltipDisabled' });

  private overlayRef: OverlayRef | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private describedById: string | null = null;

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);

  @HostListener('mouseenter')
  @HostListener('focusin')
  onShow(): void {
    if (this.disabled() || !this.hasText() || this.overlayRef) return;
    this.clearTimer();
    this.timer = setTimeout(() => this.show(), this.delay());
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onHide(): void {
    this.clearTimer();
    this.hide();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.hide();
  }

  private hasText(): boolean {
    const t = this.text();
    return typeof t === 'string' && t.trim().length > 0;
  }

  private show(): void {
    if (!this.hasText() || this.overlayRef) return;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef.nativeElement)
      .withPositions(this.buildPositions())
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'lnk-tooltip-overlay',
    });

    const portal = new ComponentPortal(LnkTooltipComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.setInput('text', this.text() ?? '');
    componentRef.setInput('variant', this.variant());
    componentRef.setInput('customClass', this.customClass());

    // Accessibilità: lega il tooltip all'elemento host
    this.describedById = `lnk-tooltip-${Math.random().toString(36).slice(2, 9)}`;
    const tooltipEl = componentRef.location.nativeElement as HTMLElement;
    tooltipEl.id = this.describedById;
    this.elementRef.nativeElement.setAttribute('aria-describedby', this.describedById);
  }

  private hide(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    if (this.describedById) {
      this.elementRef.nativeElement.removeAttribute('aria-describedby');
      this.describedById = null;
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private buildPositions(): ConnectedPosition[] {
    const map: Record<LnkTooltipPosition, ConnectedPosition> = {
      above: {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
      },
      below: {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 8,
      },
      left: {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
        offsetX: -8,
      },
      right: {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
        offsetX: 8,
      },
    };
    // Posizione preferita + fallback in caso di poco spazio
    const requested = this.position();
    const fallbackOrder: LnkTooltipPosition[] = ['above', 'below', 'right', 'left'];
    const fallback = fallbackOrder.filter((p) => p !== requested);
    return [map[requested], ...fallback.map((p) => map[p])];
  }
}
