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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { MatTooltipModule, type TooltipPosition } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

/** Modalità di posizionamento del pannello. */
export type TweaksPanelPlacement = 'floating' | 'right' | 'left';

/** Posizione del FAB quando il pannello è chiuso. */
export type TweaksFabPosition = 'bottom-right' | 'bottom-left' | 'top-right';

/**
 * Pannello "tweaks" riutilizzabile — shell che ospita controlli per
 * personalizzare al volo il layout/feature corrente.
 *
 * UX:
 *  - Quando chiuso mostra un FAB (bottom-right di default) con icona.
 *  - Quando aperto si comporta in base a `placement`:
 *      - `'floating'` (default): card flottante draggabile dalla header,
 *        senza overlay scuro; clic fuori NON chiude (resta interattiva).
 *      - `'right'` / `'left'`: drawer ancorato al bordo con overlay scuro;
 *        clic sull'overlay chiude.
 *  - `Esc` chiude in entrambe le modalità.
 *  - In `'floating'` la posizione iniziale è sopra il FAB; ogni drag aggiorna
 *    `pos` (signal) e clamp dentro al viewport. Reset alla chiusura.
 *
 *   ```html
 *   <lnk-tweaks-panel [(open)]="open" titleKey="Tweaks.Title" (reset)="reset()">
 *     <lnk-tweak-section titleKey="Tweaks.Layout">
 *       <lnk-tweak-row labelKey="Tweaks.View">
 *         <lnk-tweak-segmented
 *           [options]="viewOptions"
 *           [value]="viewMode()"
 *           (valueChange)="onViewMode($event)" />
 *       </lnk-tweak-row>
 *     </lnk-tweak-section>
 *   </lnk-tweaks-panel>
 *   ```
 *
 * Theming via CSS vars `--lnk-tweaks-*` (vedi blocco `:host` negli stili).
 */
@Component({
  selector: 'lnk-tweaks-panel',
  standalone: true,
  imports: [TranslatePipe, NgIcon, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: contents;
    }

    .lnk-tweaks-fab {
      position: fixed;
      z-index: 60;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--lnk-tweaks-fab-bg, var(--card-bg));
      color: var(--lnk-tweaks-fab-text, var(--foreground));
      border: 1px solid var(--lnk-tweaks-fab-border, var(--card-border));
      box-shadow:
        var(
          --lnk-tweaks-fab-shadow,
          0 4px 12px rgb(0 0 0 / 0.10),
          0 2px 4px rgb(0 0 0 / 0.06)
        );
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
    }
    .lnk-tweaks-fab:hover {
      background: var(--lnk-tweaks-fab-hover-bg, var(--card-hover, var(--muted)));
    }
    .lnk-tweaks-fab:focus-visible {
      outline: 2px solid var(--lnk-tweaks-focus-ring, var(--primary));
      outline-offset: 2px;
    }

    .lnk-tweaks-overlay {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: rgb(0 0 0 / 0.25);
      animation: lnk-tweaks-fade 0.15s ease-out;
    }

    .lnk-tweaks-panel {
      position: fixed;
      z-index: 61;
      width: var(--lnk-tweaks-width, 20rem);
      max-width: calc(100vw - 1rem);
      max-height: calc(100vh - 1rem);
      display: flex;
      flex-direction: column;
      background: var(--lnk-tweaks-bg, var(--card-bg));
      color: var(--foreground);
      border: 1px solid var(--lnk-tweaks-border, var(--card-border));
    }

    /* ----- Drawer (right / left, ancorato al bordo, full-height) ----- */
    .lnk-tweaks-panel--right,
    .lnk-tweaks-panel--left {
      top: 0;
      bottom: 0;
      max-height: none;
      border-radius: 0;
      animation: lnk-tweaks-slide-in 0.2s ease-out;
    }
    .lnk-tweaks-panel--right {
      right: 0;
      border-top: 0;
      border-right: 0;
      border-bottom: 0;
      box-shadow: var(--lnk-tweaks-shadow, -8px 0 24px rgb(0 0 0 / 0.12));
    }
    .lnk-tweaks-panel--left {
      left: 0;
      border-top: 0;
      border-left: 0;
      border-bottom: 0;
      box-shadow: var(--lnk-tweaks-shadow, 8px 0 24px rgb(0 0 0 / 0.12));
      animation-name: lnk-tweaks-slide-in-left;
    }

    /* ----- Floating (card libera, draggabile) ----- */
    /* Posizione iniziale sopra al FAB (sotto al goto-top) — vedi media
       query sotto. */
    .lnk-tweaks-panel--floating {
      bottom: 12.5rem;
      right: 1rem;
      border-radius: var(--lnk-tweaks-radius, 0.875rem);
      box-shadow:
        var(
          --lnk-tweaks-floating-shadow,
          0 18px 40px rgb(0 0 0 / 0.18),
          0 4px 12px rgb(0 0 0 / 0.10)
        );
      animation: lnk-tweaks-pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: bottom right;
    }
    @media (min-width: 1024px) {
      .lnk-tweaks-panel--floating {
        bottom: 8.5rem;
        right: 1.5rem;
      }
    }
    .lnk-tweaks-panel--floating.is-positioned {
      bottom: auto;
      right: auto;
      transform-origin: top left;
    }
    .lnk-tweaks-panel--floating.is-dragging {
      animation: none;
      transition: none;
      user-select: none;
      cursor: grabbing;
    }
    .lnk-tweaks-panel--floating .lnk-tweaks-header {
      cursor: grab;
      touch-action: none;
    }
    .lnk-tweaks-panel--floating.is-dragging .lnk-tweaks-header {
      cursor: grabbing;
    }

    .lnk-tweaks-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--card-border);
      flex-shrink: 0;
    }
    .lnk-tweaks-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }
    .lnk-tweaks-subtitle {
      display: block;
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--muted-foreground);
      margin-top: 0.125rem;
    }
    .lnk-tweaks-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 0.375rem;
      color: var(--muted-foreground);
      background: transparent;
      border: 0;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .lnk-tweaks-close:hover {
      background: var(--muted);
      color: var(--foreground);
    }
    .lnk-tweaks-close:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .lnk-tweaks-body {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 1rem 1.25rem;
    }

    .lnk-tweaks-footer {
      flex-shrink: 0;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--card-border);
      background: var(--muted);
      border-bottom-left-radius: inherit;
      border-bottom-right-radius: inherit;
    }

    /* Posizione FAB: stack sopra al lnk-goto-top per evitare la
       sovrapposizione (goto-top a bottom 5rem mobile / 1.5rem
       desktop, altezza 2.75rem). Mobile: bottom 9rem; desktop: 5rem. */
    .lnk-tweaks-fab--bottom-right {
      bottom: 9rem;
      right: 1rem;
    }
    .lnk-tweaks-fab--bottom-left {
      bottom: 9rem;
      left: 1rem;
    }
    .lnk-tweaks-fab--top-right {
      top: 4.5rem;
      right: 1.5rem;
    }
    @media (min-width: 1024px) {
      .lnk-tweaks-fab--bottom-right {
        bottom: 5rem;
        right: 1.5rem;
      }
      .lnk-tweaks-fab--bottom-left {
        bottom: 5rem;
        left: 1.5rem;
      }
    }

    @keyframes lnk-tweaks-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes lnk-tweaks-slide-in {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes lnk-tweaks-slide-in-left {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    @keyframes lnk-tweaks-pop-in {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }
  `,
  template: `
    @if (open()) {
      @if (showOverlay()) {
        <div
          class="lnk-tweaks-overlay"
          aria-hidden="true"
          (click)="close()"
        ></div>
      }
      <aside
        #panel
        class="lnk-tweaks-panel"
        [class]="placementClass()"
        [class.is-positioned]="hasFloatingPosition()"
        [class.is-dragging]="dragging()"
        [style.top.px]="floatTop()"
        [style.left.px]="floatLeft()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="titleKey() | translate"
      >
        <header
          class="lnk-tweaks-header"
          (pointerdown)="onDragPointerDown($event)"
          (pointermove)="onDragPointerMove($event)"
          (pointerup)="onDragPointerUp($event)"
          (pointercancel)="onDragPointerUp($event)"
        >
          <div class="min-w-0">
            <h2 class="lnk-tweaks-title">{{ titleKey() | translate }}</h2>
            @if (subtitleKey(); as sub) {
              <span class="lnk-tweaks-subtitle">{{ sub | translate }}</span>
            }
          </div>
          <button
            type="button"
            class="lnk-tweaks-close"
            [attr.aria-label]="'Common.Close' | translate"
            (click)="close()"
          >
            <ng-icon name="bootstrapXLg" size="1.125rem" />
          </button>
        </header>

        <div class="lnk-tweaks-body">
          <ng-content />
        </div>

        @if (showReset()) {
          <footer class="lnk-tweaks-footer">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              (click)="onReset()"
            >
              {{ resetLabelKey() | translate }}
            </button>
          </footer>
        }
      </aside>
    } @else if (showFab()) {
      <button
        type="button"
        class="lnk-tweaks-fab"
        [class]="fabPositionClass()"
        [attr.aria-label]="titleKey() | translate"
        [matTooltip]="(tooltipKey() ?? titleKey()) | translate"
        [matTooltipPosition]="tooltipPosition()"
        matTooltipShowDelay="300"
        (click)="toggle()"
      >
        <ng-icon [name]="fabIcon()" size="1.25rem" />
      </button>
    }
  `,
})
export class TweaksPanelComponent {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /** Chiave i18n del titolo (anche aria-label del FAB). */
  readonly titleKey = input.required<string>();
  /** Sottotitolo opzionale sotto il titolo nell'header. */
  readonly subtitleKey = input<string | undefined>(undefined);
  /** Stato apertura — two-way. */
  readonly open = model<boolean>(false);
  /**
   * Modalità di posizionamento.
   * - `'floating'` (default): card mobile draggabile dalla header.
   * - `'right'` / `'left'`: drawer ancorato al bordo, con overlay.
   */
  readonly placement = input<TweaksPanelPlacement>('floating');
  /** Posizione del FAB quando il pannello è chiuso. */
  readonly fabPosition = input<TweaksFabPosition>('bottom-right');
  /** Icona del FAB. */
  readonly fabIcon = input<string>('bootstrapSliders2');
  /**
   * Visibilità del FAB (default `true`). Se `false`, il pannello viene
   * controllato solo via two-way `[(open)]` dal chiamante (utile per
   * trigger custom in toolbar/menu, oppure per scenari dev-only).
   */
  readonly showFab = input<boolean>(true);
  /**
   * Chiave i18n del tooltip sul FAB. Opzionale: se omessa ricade su
   * `titleKey` (stesso testo del header del pannello).
   */
  readonly tooltipKey = input<string | undefined>(undefined);
  /** Posizione del tooltip Material rispetto al FAB. Default `'left'`. */
  readonly tooltipPosition = input<TooltipPosition>('left');
  /** Mostra il pulsante reset nel footer. */
  readonly showReset = input<boolean>(false);
  /** Chiave i18n del label reset. */
  readonly resetLabelKey = input<string>('Tweaks.Reset');

  /** Emesso quando l'utente clicca il pulsante reset nel footer. */
  readonly reset = output<void>();

  /**
   * Posizione corrente in modalità `'floating'` (top/left in px del viewport).
   * Se `null` il pannello usa la posizione di default (sopra al FAB).
   */
  protected readonly pos = signal<{ x: number; y: number } | null>(null);
  /** Vero mentre l'utente sta trascinando. */
  protected readonly dragging = signal(false);

  protected readonly placementClass = computed(
    () => `lnk-tweaks-panel--${this.placement()}`
  );
  protected readonly fabPositionClass = computed(
    () => `lnk-tweaks-fab--${this.fabPosition()}`
  );
  protected readonly showOverlay = computed(() => this.placement() !== 'floating');
  protected readonly hasFloatingPosition = computed(
    () => this.placement() === 'floating' && this.pos() !== null
  );
  protected readonly floatTop = computed(() => {
    if (!this.hasFloatingPosition()) return null;
    return this.pos()!.y;
  });
  protected readonly floatLeft = computed(() => {
    if (!this.hasFloatingPosition()) return null;
    return this.pos()!.x;
  });

  // ---- drag state interno (non serve come signal: cambia ad ogni move) ----
  private dragOrigin: {
    pointerId: number;
    mx: number;
    my: number;
    px: number;
    py: number;
  } | null = null;

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
    this.pos.set(null);
  }

  onReset(): void {
    this.reset.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  // ---- drag (solo placement === 'floating') -----------------------------

  onDragPointerDown(ev: PointerEvent): void {
    if (this.placement() !== 'floating') return;
    // ignora i click su control interattivi nell'header (es. close)
    const t = ev.target as HTMLElement;
    if (t.closest('button, input, select, textarea, a')) return;

    const panel = this.findPanel();
    if (!panel) return;
    const rect = panel.getBoundingClientRect();

    this.dragOrigin = {
      pointerId: ev.pointerId,
      mx: ev.clientX,
      my: ev.clientY,
      px: rect.left,
      py: rect.top,
    };
    // inizializza pos al rect corrente per evitare un salto al primo move
    this.pos.set({ x: rect.left, y: rect.top });
    this.dragging.set(true);
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    ev.preventDefault();
  }

  onDragPointerMove(ev: PointerEvent): void {
    const o = this.dragOrigin;
    if (!o || ev.pointerId !== o.pointerId) return;

    const panel = this.findPanel();
    if (!panel) return;
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const margin = 8;
    const dx = ev.clientX - o.mx;
    const dy = ev.clientY - o.my;
    const maxX = window.innerWidth - w - margin;
    const maxY = window.innerHeight - h - margin;
    const x = Math.max(margin, Math.min(maxX, o.px + dx));
    const y = Math.max(margin, Math.min(maxY, o.py + dy));
    this.pos.set({ x, y });
  }

  onDragPointerUp(ev: PointerEvent): void {
    const o = this.dragOrigin;
    if (!o) return;
    if (ev.pointerId === o.pointerId) {
      const handle = ev.currentTarget as HTMLElement;
      if (handle.hasPointerCapture(ev.pointerId)) {
        handle.releasePointerCapture(ev.pointerId);
      }
    }
    this.dragOrigin = null;
    this.dragging.set(false);
  }

  /**
   * Trova l'elemento `.lnk-tweaks-panel` dentro al template del componente.
   * Il host ha `display: contents`, quindi il pannello è figlio diretto.
   */
  private findPanel(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(
      '.lnk-tweaks-panel'
    );
  }
}
