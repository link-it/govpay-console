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

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatTooltipModule, type TooltipPosition } from '@angular/material/tooltip';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SystemFacade } from '@core/system';

/**
 * Toggle dark mode (sole/luna/auto). Cicla `light` → `dark` → `auto`.
 *
 * Due varianti:
 *   - `compact` (default): solo icona, adatta a header / sidebar collassata.
 *   - `full`: icona + label, adatta al footer della sidebar espansa.
 */
@Component({
  selector: 'lnk-color-scheme-toggle',
  standalone: true,
  imports: [NgIcon, TranslatePipe, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'full') {
      <button
        type="button"
        class="btn btn-ghost w-full justify-start"
        (click)="cycle()"
        [attr.aria-label]="hintKey() | translate"
        [matTooltip]="hintKey() | translate"
        [matTooltipPosition]="tooltipPosition()"
        matTooltipShowDelay="300"
      >
        <ng-icon [name]="icon()" size="1.125rem" />
        <span class="truncate">{{ labelKey() | translate }}</span>
      </button>
    } @else {
      <button
        type="button"
        class="btn btn-ghost btn-icon"
        (click)="cycle()"
        [attr.aria-label]="hintKey() | translate"
        [matTooltip]="hintKey() | translate"
        [matTooltipPosition]="tooltipPosition()"
        matTooltipShowDelay="300"
      >
        <ng-icon [name]="icon()" size="1.125rem" />
      </button>
    }
  `,
})
export class ColorSchemeToggleComponent {
  private readonly system = inject(SystemFacade);

  /** `compact` (solo icona) o `full` (icona + label). */
  readonly variant = input<'compact' | 'full'>('compact');
  /** Posizione del tooltip Material. Default: `below` (header). Sidebar: `right`. */
  readonly tooltipPosition = input<TooltipPosition>('below');

  readonly scheme = this.system.colorScheme;

  readonly icon = computed(() => {
    switch (this.scheme()) {
      case 'light': return 'bootstrapSun';
      case 'dark': return 'bootstrapMoon';
      default: return 'bootstrapCircleHalf';
    }
  });

  /** Chiave i18n per la label corta della modalità corrente. */
  readonly labelKey = computed(() => {
    switch (this.scheme()) {
      case 'light': return 'Theme.Light';
      case 'dark': return 'Theme.Dark';
      default: return 'Theme.Auto';
    }
  });

  /** Chiave i18n per il tooltip esteso (con suggerimento sul prossimo stato). */
  readonly hintKey = computed(() => {
    switch (this.scheme()) {
      case 'light': return 'Theme.CycleHint.Light';
      case 'dark': return 'Theme.CycleHint.Dark';
      default: return 'Theme.CycleHint.Auto';
    }
  });

  cycle(): void {
    this.system.cycleColorScheme();
  }
}
