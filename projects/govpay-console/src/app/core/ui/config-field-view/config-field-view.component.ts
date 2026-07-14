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

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusBadgeComponent } from '@linkit/shared-ui';
import { decodeBase64 } from '@core/utils/base64';

/**
 * Riga read-only per un campo di configurazione (vista dettaglio): mostra
 * l'etichetta e un badge **Configurato / Non configurato**. Se configurato,
 * il contenuto (base64 decodificato, JSON indentato) è rivelato solo su
 * richiesta ("Mostra").
 */
@Component({
  selector: 'lnk-config-field-view',
  standalone: true,
  imports: [NgIcon, TranslatePipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block py-2' },
  template: `
    <div class="flex items-center gap-3">
      <span class="text-sm flex-1 min-w-0 truncate">{{ labelKey() | translate }}</span>
      @if (configured()) {
        <button type="button" class="btn btn-ghost btn-sm" (click)="expanded.set(!expanded())">
          <ng-icon [name]="expanded() ? 'bootstrapEyeSlash' : 'bootstrapEye'" size="1rem" />
          <span>{{ (expanded() ? 'CodeField.Nascondi' : 'CodeField.Mostra') | translate }}</span>
        </button>
        <lnk-status-badge tone="success" labelKey="TipiPendenza.Config.Configurato" />
      } @else {
        <lnk-status-badge tone="muted" labelKey="TipiPendenza.Config.NonConfigurato" />
      }
    </div>
    @if (configured() && expanded()) {
      <div class="relative mt-2">
        <button type="button" class="btn btn-ghost btn-sm absolute top-1.5 right-1.5" (click)="copy()">
          <ng-icon [name]="copied() ? 'bootstrapCheck2' : 'bootstrapClipboard'" size="1rem" />
          <span>{{ (copied() ? 'Common.Copied' : 'Common.Copy') | translate }}</span>
        </button>
        <pre class="overflow-auto max-h-80 rounded border border-[var(--border)] bg-[var(--muted)] p-3 pr-24 text-xs">{{ text() }}</pre>
      </div>
    }
  `,
})
export class ConfigFieldViewComponent {
  readonly labelKey = input.required<string>();
  readonly value = input<unknown>(null);

  protected readonly expanded = signal(false);
  protected readonly copied = signal(false);

  /** Copia il contenuto negli appunti con feedback temporaneo. */
  protected copy(): void {
    void navigator.clipboard?.writeText(this.text()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    });
  }

  readonly configured = computed(() => {
    const v = this.value();
    if (v == null || v === '') return false;
    if (typeof v === 'string') return v.trim().length > 0;
    return true;
  });

  /** Contenuto decodificato e (se JSON) indentato. */
  protected readonly text = computed(() => {
    const v = this.value();
    if (v == null || v === '') return '';
    let t = typeof v === 'string' ? decodeBase64(v) : JSON.stringify(v, null, 2);
    try {
      t = JSON.stringify(JSON.parse(t), null, 2);
    } catch {
      /* non-JSON (es. freemarker): grezzo */
    }
    return t;
  });
}
