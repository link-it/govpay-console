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
import { ConfigService } from '@core/config';
import { LayoutOverridesService } from '@core/system';
import { TweakGlobalSectionComponent } from './tweak-global-section.component';
import { TweakRowComponent } from './tweak-row.component';
import { TweakSectionComponent } from './tweak-section.component';
import { TweakSegmentedComponent } from './tweak-segmented.component';
import { TweakToggleComponent } from './tweak-toggle.component';
import { TweaksPanelComponent } from './tweaks-panel.component';
import { TweaksRegistry } from './tweaks-registry.service';

/**
 * Host globale del pannello tweaks: una sola istanza montata in
 * `MainLayoutComponent`. Il FAB è sempre presente (gated da
 * `Layout.tweaksPanel`); le sezioni sono renderizzate dinamicamente
 * leggendo da `TweaksRegistry`.
 *
 * I component che vogliono contribuire opzioni al pannello chiamano
 * `tweaks.register({ id, titleKey, rows, onReset })` in costruttore
 * e passano la cleanup function a `DestroyRef.onDestroy`.
 *
 *   ```ts
 *   constructor() {
 *     const tweaks = inject(TweaksRegistry);
 *     inject(DestroyRef).onDestroy(
 *       tweaks.register({ id: 'pendenze', titleKey: 'Tweaks.Layout',
 *         rows: [...], onReset: () => ... })
 *     );
 *   }
 *   ```
 *
 * La sezione globale (`<lnk-tweak-global-section>`) è inclusa nativamente
 * come prima sezione del pannello e non passa per il registry: gestisce
 * gli override `Layout` (max-width, helpButton, posizioni controlli, ...)
 * direttamente via `LayoutOverridesService`.
 */
@Component({
  selector: 'lnk-global-tweaks-host',
  standalone: true,
  imports: [
    TweaksPanelComponent,
    TweakSectionComponent,
    TweakRowComponent,
    TweakSegmentedComponent,
    TweakToggleComponent,
    TweakGlobalSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lnk-tweaks-panel
      [(open)]="registry.open"
      titleKey="Tweaks.Title"
      subtitleKey="Tweaks.Subtitle"
      [showFab]="fabVisible()"
      [showReset]="hasReset()"
      (reset)="onReset()"
    >
      <lnk-tweak-global-section />

      @for (section of registry.sections(); track section.id) {
        <lnk-tweak-section
          [titleKey]="section.titleKey"
          [descriptionKey]="section.descriptionKey"
        >
          @for (row of section.rows; track row.labelKey) {
            <lnk-tweak-row
              [labelKey]="row.labelKey"
              [hintKey]="row.hintKey"
              [inline]="row.type === 'toggle'"
            >
              @switch (row.type) {
                @case ('segmented') {
                  <lnk-tweak-segmented
                    [options]="row.options"
                    size="sm"
                    [value]="row.value()"
                    (valueChange)="row.onChange($event)"
                  />
                }
                @case ('toggle') {
                  <lnk-tweak-toggle
                    [value]="row.value()"
                    (valueChange)="row.onChange($event)"
                  />
                }
              }
            </lnk-tweak-row>
          }
        </lnk-tweak-section>
      }
    </lnk-tweaks-panel>
  `,
})
export class GlobalTweaksHostComponent {
  protected readonly registry = inject(TweaksRegistry);
  private readonly config = inject(ConfigService);
  private readonly overrides = inject(LayoutOverridesService);

  /** FAB visibile solo se `Layout.tweaksPanel !== false`. */
  protected readonly fabVisible = computed(
    () => this.config.appConfig()?.Layout.tweaksPanel !== false
  );

  /**
   * Mostra il pulsante "Reset" del footer se c'è qualcosa da resettare:
   * almeno un override globale OR almeno una sezione registrata.
   */
  protected readonly hasReset = computed(
    () => this.overrides.hasAnyOverride() || this.registry.count() > 0
  );

  /** Reset combinato: globali + onReset di ogni sezione registrata. */
  protected onReset(): void {
    this.overrides.reset();
    this.registry.resetAll();
  }
}
