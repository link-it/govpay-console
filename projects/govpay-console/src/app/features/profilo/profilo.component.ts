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

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@core/auth';
import { PreferencesService, LIST_VIEW_FEATURES, type ListViewMode } from '@core/preferences';
import { LanguageService, SystemFacade, SelectComponent, type ColorScheme, type LnkSelectOption } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  TabsComponent,
  type InfoGridItem,
  type TabDef,
  ListStickyToolbarDirective,
} from '@linkit/shared-ui';

@Component({
  selector: 'lnk-profilo',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    SelectComponent,
    TabsComponent,
    PageHeaderComponent,
    DetailSectionComponent,
    InfoGridComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profilo.component.html',
})
export class ProfiloComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly system = inject(SystemFacade);
  private readonly lang = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly prefs = inject(PreferencesService);

  readonly user = this.auth.user;

  /** Tab attivo: dati del profilo vs preferenze UI. */
  readonly activeTab = signal('profilo');
  readonly tabs: TabDef[] = [
    { id: 'profilo', labelKey: 'Profilo.Tabs.Profilo', icon: 'bootstrapPerson' },
    { id: 'preferenze', labelKey: 'Profilo.Tabs.Preferenze', icon: 'bootstrapSliders2' },
  ];

  /* ── Preferenze UI ────────────────────────────────────────────────── */
  readonly colorScheme = this.system.colorScheme;
  readonly locale = this.lang.current;
  /** `true` se le preferenze sono sincronizzate sull'account (operatore). */
  readonly prefsSynced = this.prefs.available;

  readonly colorSchemeOptions = computed<LnkSelectOption[]>(() => {
    this.lang.current(); // ritraduci al cambio lingua
    const t = (k: string) => this.translate.instant(k);
    return [
      { value: 'auto', label: t('Theme.Auto') },
      { value: 'light', label: t('Theme.Light') },
      { value: 'dark', label: t('Theme.Dark') },
    ];
  });

  readonly languageOptions = computed<LnkSelectOption[]>(() =>
    this.lang.languages().map((l) => ({ value: l.code, label: l.label })),
  );

  onColorScheme(value: string): void {
    this.system.setColorScheme(value as ColorScheme);
  }
  onLanguage(value: string): void {
    this.lang.setLanguage(value);
  }

  /* ── Vista delle liste, per feature ───────────────────────────────── */
  readonly viewFeatures = LIST_VIEW_FEATURES;

  readonly viewOptions = computed<LnkSelectOption[]>(() => {
    this.lang.current();
    const t = (k: string) => this.translate.instant(k);
    return [
      { value: 'default', label: t('Profilo.Preferenze.ViewAuto') },
      { value: 'table', label: t('Profilo.Preferenze.ViewTable') },
      { value: 'rows', label: t('Profilo.Preferenze.ViewRows') },
    ];
  });

  /** Vista salvata per la feature (`'default'` = predefinita, sentinel non vuoto). */
  viewOf(feature: string): string {
    return this.prefs.featureView(feature) ?? 'default';
  }

  onViewFeature(feature: string, value: string): void {
    this.prefs.setFeatureView(feature, value === 'default' ? null : (value as ListViewMode));
  }

  readonly anagraficaItems = computed<InfoGridItem[]>(() => {
    const u = this.user();
    if (!u) return [];
    return [
      { labelKey: 'Profilo.Detail.Nome', value: u.displayName, wide: true, hide: !u.displayName },
      { labelKey: 'Profilo.Detail.Username', value: u.username, mono: true },
      { labelKey: 'Profilo.Detail.Email', value: u.email, hide: !u.email },
      { labelKey: 'Profilo.Detail.Autenticazione', value: u.autenticazione, hide: !u.autenticazione },
    ];
  });

  readonly dominiList = computed<{ idDominio: string; ragioneSociale?: string }[]>(() => {
    const u = this.user();
    return u?.domini ?? [];
  });

  readonly tipiPendenzaList = computed<{ idTipoPendenza: string; descrizione?: string }[]>(() => {
    const u = this.user();
    return u?.tipiPendenza ?? [];
  });

  readonly aclList = computed(() => this.user()?.aclRaw ?? []);

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Profilo' }]);
  }

  hasRead(autorizzazioni: string[]): boolean {
    return autorizzazioni?.includes('R');
  }
  hasWrite(autorizzazioni: string[]): boolean {
    return autorizzazioni?.includes('W');
  }
}
