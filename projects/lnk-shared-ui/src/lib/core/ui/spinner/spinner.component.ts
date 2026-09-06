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

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SystemFacade } from '../../system';

/**
 * Spinner overlay globale che reagisce al contatore di loading di
 * `SystemFacade`. Renderizza un backdrop semi-trasparente con uno
 * spinner CSS-only centrato (48px, color `--primary`).
 *
 * Stesso pattern di `<lnk-loading>` (border-top trasparente +
 * `@keyframes lnk-spin`) ma con dimensione fissa: zero dipendenza da
 * `@angular/material/progress-spinner`.
 */
@Component({
  selector: 'lnk-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .lnk-overlay-spinner {
      display: block;
      width: 48px;
      height: 48px;
      border: 4px solid var(--primary);
      border-top-color: transparent;
      border-radius: 9999px;
      animation: lnk-spin 0.8s linear infinite;
    }
    @keyframes lnk-spin { to { transform: rotate(360deg); } }
  `,
  template: `
    @if (loading()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="lnk-overlay-spinner" aria-hidden="true"></span>
      </div>
    }
  `,
})
export class SpinnerComponent {
  private readonly system = inject(SystemFacade);
  readonly loading = this.system.loading;
}
