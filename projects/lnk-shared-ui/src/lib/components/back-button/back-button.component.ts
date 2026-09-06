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

import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

export type BackButtonSize = 'sm' | 'md' | 'lg';

/**
 * Pulsante "Indietro" riusabile.
 *
 *   <!-- Default: torna alla pagina precedente (browser history) -->
 *   <lnk-back-button />
 *
 *   <!-- Override navigazione: punta a una rotta specifica -->
 *   <lnk-back-button targetRoute="/audit-reports" />
 *
 *   <!-- Logica custom: intercetta il click con preventDefault -->
 *   <lnk-back-button (back)="onBack($event)" />
 *
 * Comportamento di default: `Location.back()` (browser history),
 * coerente con lo stato dei filtri/scroll della pagina di provenienza.
 * Se `targetRoute` è valorizzato, naviga via Router invece che back.
 * Il `(back)` emette dopo la navigazione — se vuoi bloccarla, chiama
 * `event.preventDefault()` nel handler.
 */
@Component({
  selector: 'lnk-back-button',
  standalone: true,
  imports: [NgIcon, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (targetRoute(); as route) {
      <a [routerLink]="route" class="btn btn-secondary" [class]="sizeClass()" (click)="emitBack($event)">
        <ng-icon [name]="iconName()" [style.width]="iconPx()" [style.height]="iconPx()" />
        <span class="text-nowrap">{{ labelKey() | translate }}</span>
      </a>
    } @else {
      <button type="button" class="btn btn-secondary" [class]="sizeClass()" (click)="onClick($event)">
        <ng-icon [name]="iconName()" [style.width]="iconPx()" [style.height]="iconPx()" />
        <span class="text-nowrap">{{ labelKey() | translate }}</span>
      </button>
    }
  `,
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  /** Chiave i18n del testo. Default `'Common.Back'`. */
  readonly labelKey = input<string>('Common.Back');
  /** Nome icona bootstrap (registrata nel consumer). Default `'bootstrapChevronLeft'`. */
  readonly iconName = input<string>('bootstrapChevronLeft');
  /** Dimensione del bottone: `sm` (default), `md`, `lg`. */
  readonly size = input<BackButtonSize>('sm');
  /**
   * Se valorizzato, il bottone naviga via Router a questa rotta invece
   * di usare `Location.back()` (utile quando la history del browser è
   * inaffidabile, es. apertura diretta del dettaglio in nuova tab).
   */
  readonly targetRoute = input<string | undefined>(undefined);

  /**
   * Emesso al click. `preventDefault()` blocca la navigazione di default
   * (utile per intercettare e gestire la logica nel componente padre).
   */
  @Output() readonly back = new EventEmitter<{ preventDefault: () => void; defaultPrevented: boolean }>();

  protected readonly sizeClass = computed(() => {
    switch (this.size()) {
      case 'md': return '';
      case 'lg': return 'btn-lg';
      default:   return 'btn-sm';
    }
  });

  protected readonly iconPx = computed(() => {
    switch (this.size()) {
      case 'md': return '16px';
      case 'lg': return '18px';
      default:   return '14px';
    }
  });

  protected onClick(_event: MouseEvent): void {
    let prevented = false;
    const ev = {
      preventDefault: () => { prevented = true; },
      get defaultPrevented() { return prevented; },
    };
    this.back.emit(ev);
    if (prevented) return;
    this.location.back();
  }

  /** Emesso anche per il ramo `<a routerLink>` — `preventDefault` blocca il Router. */
  protected emitBack(event: MouseEvent): void {
    let prevented = false;
    const ev = {
      preventDefault: () => { prevented = true; event.preventDefault(); },
      get defaultPrevented() { return prevented; },
    };
    this.back.emit(ev);
  }
}
