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

import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { TabsComponent, type TabDef, type TabsSize } from '@shared';
import type { TweakSegmentedOption } from './tweaks-types';

// Re-export per backward-compat: i consumer ottenevano `TweakSegmentedOption`
// da questo modulo prima dell'estrazione in `tweaks-types`.
export type { TweakSegmentedOption };

/**
 * Segmented control (pillola) bound a una scelta enum-like.
 * Riusa internamente `<lnk-tabs variant="segmented">` per mantenere coerenza
 * grafica con i tab e beneficiare del theming `--lnk-tabs-segmented-*`.
 *
 *   ```html
 *   <lnk-tweak-segmented
 *     [options]="[{ value: 'table', labelKey: 'Tweaks.View.Table' },
 *                 { value: 'rows',  labelKey: 'Tweaks.View.Rows' }]"
 *     [(value)]="viewMode"
 *   />
 *   ```
 */
@Component({
  selector: 'lnk-tweak-segmented',
  standalone: true,
  imports: [TabsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
  `,
  template: `
    <lnk-tabs
      [tabs]="tabs()"
      [activeId]="value()"
      (activeIdChange)="value.set($event)"
      variant="segmented"
      [size]="size()"
    />
  `,
})
export class TweakSegmentedComponent {
  readonly options = input.required<TweakSegmentedOption[]>();
  readonly value = model.required<string>();
  /** Dimensione del segmented (forwardata a `<lnk-tabs>`). Default `md`. */
  readonly size = input<TabsSize>('md');

  protected readonly tabs = computed<TabDef[]>(() =>
    this.options().map((o) => ({ id: o.value, labelKey: o.labelKey, icon: o.icon }))
  );
}
