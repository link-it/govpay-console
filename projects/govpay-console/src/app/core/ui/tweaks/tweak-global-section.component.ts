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
import { TranslatePipe } from '@ngx-translate/core';
import { ConfigService } from '@core/config';
import type { ControlPosition } from '@core/config';
import { LayoutOverridesService } from '@core/system';
import { TweakRowComponent } from './tweak-row.component';
import { TweakSectionComponent } from './tweak-section.component';
import {
  TweakSegmentedComponent,
  type TweakSegmentedOption,
} from './tweak-segmented.component';
import { TweakToggleComponent } from './tweak-toggle.component';

const MAX_WIDTH_OPTIONS: TweakSegmentedOption[] = [
  { value: 'none', labelKey: 'Tweaks.MaxWidth.Full' },
  { value: '64rem', labelKey: 'Tweaks.MaxWidth.M' },
  { value: '80rem', labelKey: 'Tweaks.MaxWidth.L' },
  { value: '96rem', labelKey: 'Tweaks.MaxWidth.XL' },
];

const POSITION_OPTIONS: TweakSegmentedOption[] = [
  { value: 'header', labelKey: 'Tweaks.Position.Header' },
  { value: 'sidebar', labelKey: 'Tweaks.Position.Sidebar' },
  { value: 'none', labelKey: 'Tweaks.Position.None' },
];

/**
 * Sezione "Globale" del pannello tweaks: espone gli override session-level
 * delle chiavi `Layout` configurabili a runtime.
 *
 * Usata da ogni feature list che integra `<lnk-tweaks-panel>`:
 *
 *   ```html
 *   <lnk-tweaks-panel [(open)]="open" titleKey="Tweaks.Title">
 *     <!-- sezione globale (uguale ovunque) -->
 *     <lnk-tweak-global-section />
 *
 *     <!-- sezione locale (specifica della feature) -->
 *     <lnk-tweak-section titleKey="Tweaks.Layout">
 *       <lnk-tweak-row labelKey="Tweaks.View"> ... </lnk-tweak-row>
 *     </lnk-tweak-section>
 *   </lnk-tweaks-panel>
 *   ```
 *
 * Tutti i controlli scrivono su `LayoutOverridesService`. Il merge con la
 * config base avviene in `ConfigService.effectiveLayout()`. Il pulsante
 * "Reset globali" della sezione azzera SOLO gli override globali (non
 * tocca i tweak locali, che restano sotto controllo del consumer).
 */
@Component({
  selector: 'lnk-tweak-global-section',
  standalone: true,
  imports: [
    TranslatePipe,
    TweakSectionComponent,
    TweakRowComponent,
    TweakSegmentedComponent,
    TweakToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lnk-tweak-section titleKey="Tweaks.Global" descriptionKey="Tweaks.GlobalHint">
      <lnk-tweak-row labelKey="Tweaks.ListMaxWidth" hintKey="Tweaks.MaxWidthHint">
        <lnk-tweak-segmented
          [options]="maxWidthOptions"
          size="sm"
          [value]="listMaxWidth()"
          (valueChange)="onListMaxWidthChange($event)"
        />
      </lnk-tweak-row>
      <lnk-tweak-row labelKey="Tweaks.DetailMaxWidth" hintKey="Tweaks.MaxWidthHint">
        <lnk-tweak-segmented
          [options]="maxWidthOptions"
          size="sm"
          [value]="detailMaxWidth()"
          (valueChange)="onDetailMaxWidthChange($event)"
        />
      </lnk-tweak-row>
      <lnk-tweak-row labelKey="Tweaks.HelpButton" [inline]="true">
        <lnk-tweak-toggle
          [value]="helpButton()"
          (valueChange)="onHelpButtonChange($event)"
        />
      </lnk-tweak-row>
      <lnk-tweak-row labelKey="Tweaks.GotoTopButton" [inline]="true">
        <lnk-tweak-toggle
          [value]="gotoTopButton()"
          (valueChange)="onGotoTopButtonChange($event)"
        />
      </lnk-tweak-row>
      <lnk-tweak-row labelKey="Tweaks.LanguagePosition" hintKey="Tweaks.PositionHint">
        <lnk-tweak-segmented
          [options]="positionOptions"
          size="sm"
          [value]="languagePosition()"
          (valueChange)="onLanguagePositionChange($event)"
        />
      </lnk-tweak-row>
      <lnk-tweak-row labelKey="Tweaks.DarkModePosition" hintKey="Tweaks.PositionHint">
        <lnk-tweak-segmented
          [options]="positionOptions"
          size="sm"
          [value]="darkModePosition()"
          (valueChange)="onDarkModePositionChange($event)"
        />
      </lnk-tweak-row>
      @if (overrides.hasAnyOverride()) {
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          (click)="resetGlobals()"
        >
          {{ 'Tweaks.ResetGlobals' | translate }}
        </button>
      }
    </lnk-tweak-section>
  `,
})
export class TweakGlobalSectionComponent {
  protected readonly overrides = inject(LayoutOverridesService);
  private readonly config = inject(ConfigService);

  protected readonly maxWidthOptions = MAX_WIDTH_OPTIONS;
  protected readonly positionOptions = POSITION_OPTIONS;

  protected readonly listMaxWidth = computed(
    () => this.config.effectiveLayout()?.listMaxWidth ?? 'none'
  );
  protected readonly detailMaxWidth = computed(
    () => this.config.effectiveLayout()?.detailMaxWidth ?? 'none'
  );
  protected readonly helpButton = computed(
    () => this.config.effectiveLayout()?.helpButton !== false
  );
  protected readonly gotoTopButton = computed(
    () => this.config.effectiveLayout()?.gotoTopButton !== false
  );
  protected readonly languagePosition = computed<string>(
    () => this.config.effectiveLayout()?.languageSelectorPosition ?? 'header'
  );
  protected readonly darkModePosition = computed<string>(
    () => this.config.effectiveLayout()?.darkModeTogglePosition ?? 'header'
  );

  onListMaxWidthChange(value: string): void {
    this.overrides.listMaxWidth.set(value);
  }
  onDetailMaxWidthChange(value: string): void {
    this.overrides.detailMaxWidth.set(value);
  }
  onHelpButtonChange(value: boolean): void {
    this.overrides.helpButton.set(value);
  }
  onGotoTopButtonChange(value: boolean): void {
    this.overrides.gotoTopButton.set(value);
  }
  onLanguagePositionChange(value: string): void {
    this.overrides.languageSelectorPosition.set(value as ControlPosition);
  }
  onDarkModePositionChange(value: string): void {
    this.overrides.darkModeTogglePosition.set(value as ControlPosition);
  }
  resetGlobals(): void {
    this.overrides.reset();
  }
}
