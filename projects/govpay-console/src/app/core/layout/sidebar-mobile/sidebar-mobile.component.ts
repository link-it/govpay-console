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
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfigService } from '@core/config';
import { SystemFacade } from '@core/system';
import { AuthService } from '@core/auth';
import { NAV_ITEMS, filterNav } from '../nav';
import { SidebarItemComponent } from '../sidebar/sidebar-item.component';
import { ProfileMenuComponent } from '../../ui/profile-menu/profile-menu.component';

@Component({
  selector: 'lnk-sidebar-mobile',
  standalone: true,
  imports: [NgIcon, TranslatePipe, SidebarItemComponent, ProfileMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-mobile.component.html',
})
export class SidebarMobileComponent {
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly open = this.system.mobileMenuOpen;
  readonly title = computed(() => this.config.appConfig()?.app?.title ?? 'GovPay Console');
  readonly logo = computed(() => this.config.branding()?.logo.full ?? '');
  readonly navItems = computed(() => filterNav(NAV_ITEMS, this.config.appConfig(), this.auth.user()?.acl));

  constructor() {
    this.router.events.subscribe(() => {
      if (this.open()) this.system.closeMobileMenu();
    });
  }

  close(): void {
    this.system.closeMobileMenu();
  }
}
