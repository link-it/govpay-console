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

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfigService } from '@core/config';

/**
 * I campi `title` e `message` di `AppConfig.Maintenance` possono essere:
 *   - una **chiave i18n** (es. `'Maintenance.Title'`) → tradotta a runtime
 *   - una **stringa libera** (es. "Servizio offline") → mostrata così com'è
 *
 * Il check è una semplice euristica: se la chiave è presente nelle traduzioni,
 * la usa; altrimenti prende la stringa raw.
 */
@Component({
  selector: 'lnk-maintenance',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-h-screen flex items-center justify-center p-6 bg-[var(--muted)]">
      <article class="max-w-lg w-full text-center space-y-4">
        <div
          class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
        >
          <ng-icon [name]="icon()" size="2.5rem" />
        </div>
        <h1 class="text-2xl font-semibold">{{ title() }}</h1>
        <p class="opacity-80">{{ message() }}</p>
        @if (estimatedEnd(); as eta) {
          <p class="text-sm opacity-60">{{ 'Maintenance.EstimatedEnd' | translate }}: <strong>{{ eta }}</strong></p>
        }
      </article>
    </section>
  `,
})
export class MaintenanceComponent {
  private readonly config = inject(ConfigService);
  private readonly translate = inject(TranslateService);

  readonly maintenance = computed(() => this.config.appConfig()?.Maintenance);
  readonly title = computed(() =>
    this.resolve(this.maintenance()?.title, 'Maintenance.Title')
  );
  readonly message = computed(() =>
    this.resolve(this.maintenance()?.message, 'Maintenance.Message')
  );
  readonly icon = computed(() => this.maintenance()?.icon || 'bootstrapGear');
  readonly estimatedEnd = computed(() => this.maintenance()?.estimatedEnd);

  /** Se `value` è chiave i18n nota, traducila; altrimenti restituisci raw o fallback. */
  private resolve(value: string | undefined, fallbackKey: string): string {
    if (!value) return this.translate.instant(fallbackKey);
    const t = this.translate.instant(value);
    return t === value && !value.includes('.') ? value : t;
  }
}
