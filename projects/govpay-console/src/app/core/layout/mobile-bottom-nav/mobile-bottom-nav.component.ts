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
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfigService } from '@core/config';
import { SystemFacade } from '@core/system';
import { AuthService } from '@core/auth';
import { NAV_ITEMS, filterNav, flattenMobile } from '../nav';

@Component({
  selector: 'lnk-mobile-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobile-bottom-nav.component.html',
})
export class MobileBottomNavComponent {
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly auth = inject(AuthService);

  readonly items = computed(() =>
    flattenMobile(filterNav(NAV_ITEMS, this.config.appConfig(), this.auth.user()?.acl))
  );

  openMore(): void {
    this.system.toggleMobileMenu();
  }
}
