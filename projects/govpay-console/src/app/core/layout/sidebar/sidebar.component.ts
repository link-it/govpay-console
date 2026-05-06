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
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfigService } from '@core/config';
import type { ExtraMenuItem } from '@core/config';
import { SystemFacade } from '@core/system';
import { AuthService } from '@core/auth';
import { VERSION } from '@environments';
import { NAV_ITEMS, filterNav } from '../nav';
import { SidebarItemComponent } from './sidebar-item.component';
import { ProfileMenuComponent } from '../../ui/profile-menu/profile-menu.component';
import { ColorSchemeToggleComponent } from '../../ui/color-scheme-toggle/color-scheme-toggle.component';
import { LanguageMenuComponent } from '../../ui/language-menu/language-menu.component';

@Component({
  selector: 'lnk-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    NgIcon,
    TranslatePipe,
    SidebarItemComponent,
    ProfileMenuComponent,
    ColorSchemeToggleComponent,
    LanguageMenuComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly auth = inject(AuthService);

  readonly collapsed = this.system.sidebarCollapsed;
  readonly branding = this.config.branding;
  readonly appConfig = this.config.appConfig;

  readonly logoFull = computed(() => this.branding()?.logo.full ?? '');
  readonly logoCompact = computed(() => this.branding()?.logo.compact ?? this.logoFull());
  readonly title = computed(() => this.appConfig()?.app?.title ?? 'GovPay Console');

  readonly navItems = computed(() => filterNav(NAV_ITEMS, this.appConfig(), this.auth.user()?.acl));
  /** Versione applicativa, dal `version.ts` auto-generato a build-time
   *  via `scripts/generate-version.js` (legge `package.json`). */
  readonly version = VERSION.version;
  readonly showVersion = computed(() => this.appConfig()?.Layout.showVersion !== false);
  /** Mostra git short SHA accanto alla versione (default `false`). */
  readonly showBuild = computed(() => this.appConfig()?.Layout.showBuild === true);
  /** Git short SHA generato a build-time. */
  readonly gitHash = VERSION.gitHash;
  /** Voci footer aggiuntive (sopra alla versione, solo a sidebar espansa). */
  readonly footerItems = computed<ExtraMenuItem[]>(
    () => this.appConfig()?.Layout.sidebarFooterItems ?? []
  );
  readonly showProfileMenu = computed(
    () => this.config.effectiveLayout()?.profileMenuPosition === 'sidebar'
  );
  readonly showDarkToggle = computed(
    () => this.config.effectiveLayout()?.darkModeTogglePosition === 'sidebar'
  );
  readonly showLanguageMenu = computed(
    () => this.config.effectiveLayout()?.languageSelectorPosition === 'sidebar'
  );
  /** True se almeno un control è da renderizzare nel footer (per evitare row vuota). */
  readonly hasFooterControls = computed(
    () => this.showDarkToggle() || this.showLanguageMenu()
  );

  /** True se il link è esterno (http/https/mailto/tel). */
  isExternalLink(href: string): boolean {
    return /^(https?:|mailto:|tel:)/i.test(href);
  }

  toggle(): void {
    this.system.toggleSidebar();
  }
}
