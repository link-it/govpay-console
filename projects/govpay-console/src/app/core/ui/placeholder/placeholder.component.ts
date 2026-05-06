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

import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { SystemFacade } from '@core/system';

/**
 * Componente segnaposto per le feature non ancora implementate.
 * `route.data.title` è una **chiave i18n** (es. `'Nav.Pendenze'`) replicata
 * anche nei breadcrumb e poi tradotta nei template.
 */
@Component({
  selector: 'lnk-placeholder',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6 space-y-2">
      <h2 class="text-2xl font-semibold">{{ label() | translate }}</h2>
      <p class="text-[var(--muted-foreground)]">{{ 'Placeholder.NotImplemented' | translate }}</p>
    </section>
  `,
})
export class PlaceholderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly system = inject(SystemFacade);

  private readonly data = toSignal(this.route.data, { initialValue: { title: 'Placeholder.NotImplemented' } as const });
  readonly label = computed(() => (this.data() as { title?: string }).title ?? 'Placeholder.NotImplemented');

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: this.label() }]);
  }
}
