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

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SystemFacade } from '@core/system';

/**
 * Spinner overlay globale che reagisce al contatore di loading di SystemFacade.
 * Mostra uno spinner Material centrato con backdrop semi-trasparente.
 */
@Component({
  selector: 'lnk-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <mat-spinner diameter="48" />
      </div>
    }
  `,
})
export class SpinnerComponent {
  private readonly system = inject(SystemFacade);
  readonly loading = this.system.loading;
}
