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

import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { LnkTooltipDirective } from '../tooltip/tooltip.directive';

const SHOW_THRESHOLD = 200;

/**
 * Pulsante flottante "torna su" mostrato solo dopo che la pagina ha
 * scrollato oltre `SHOW_THRESHOLD` px. Lo scroll torna in cima con
 * animazione `behavior: 'smooth'`.
 *
 * Renderizzato dal `MainLayoutComponent` quando `Layout.gotoTopButton`
 * è `true` (default in `app-config.json`).
 */
@Component({
  selector: 'lnk-goto-top',
  standalone: true,
  imports: [NgIcon, TranslatePipe, LnkTooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="btn btn-primary btn-icon !rounded-full w-11 h-11 fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 transition-opacity duration-150"
      style="box-shadow: 0 12px 28px rgb(0 0 0 / 0.18), 0 4px 8px rgb(0 0 0 / 0.10), inset 0 0 0 1px rgb(255 255 255 / 0.18);"
      [class.opacity-0]="!visible()"
      [class.pointer-events-none]="!visible()"
      [attr.aria-hidden]="!visible()"
      [tabIndex]="visible() ? 0 : -1"
      (click)="scrollToTop()"
      [lnkTooltip]="'Common.GotoTop' | translate"
      lnkTooltipPosition="left"
      [attr.aria-label]="'Common.GotoTop' | translate"
    >
      <ng-icon name="bootstrapArrowUpShort" size="1.5rem" />
    </button>
  `,
})
export class GotoTopComponent {
  private readonly doc = inject(DOCUMENT);

  protected readonly visible = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    const next = y > SHOW_THRESHOLD;
    if (next !== this.visible()) this.visible.set(next);
  }

  scrollToTop(): void {
    this.doc.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
