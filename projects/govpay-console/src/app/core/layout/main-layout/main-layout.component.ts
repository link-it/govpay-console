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

import { ChangeDetectionStrategy, Component, HostListener, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SidebarMobileComponent } from '../sidebar-mobile/sidebar-mobile.component';
import { HeaderBarComponent } from '../header-bar/header-bar.component';
import { MobileBottomNavComponent } from '../mobile-bottom-nav/mobile-bottom-nav.component';
import { HelpSidebarComponent } from '../help-sidebar/help-sidebar.component';
import { SnackbarComponent } from '@core/ui/snackbar/snackbar.component';
import { SpinnerComponent } from '@core/ui/spinner/spinner.component';
import { GotoTopComponent } from '@core/ui/goto-top/goto-top.component';
import { GlobalTweaksHostComponent } from '@core/ui';
import { ConfigService } from '@core/config';
import { SystemFacade } from '@core/system';

const MEDIUM_BREAKPOINT = 1024;
const LARGE_BREAKPOINT = 1280;

@Component({
  selector: 'lnk-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    TranslatePipe,
    SidebarComponent,
    SidebarMobileComponent,
    HeaderBarComponent,
    MobileBottomNavComponent,
    HelpSidebarComponent,
    SnackbarComponent,
    SpinnerComponent,
    GotoTopComponent,
    GlobalTweaksHostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private readonly system = inject(SystemFacade);
  private readonly config = inject(ConfigService);

  readonly collapsed = this.system.sidebarCollapsed;
  /** Layout.gotoTopButton (effective: config + override), default `true`. */
  readonly showGotoTop = computed(
    () => this.config.effectiveLayout()?.gotoTopButton !== false
  );

  private wasExpandedBeforeAutoCollapse: boolean | null = null;
  private lastScreenType: 'mobile' | 'medium' | 'large' | null = null;

  constructor() {
    this.checkAndAutoCollapse();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkAndAutoCollapse();
  }

  private checkAndAutoCollapse(): void {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const screenType: 'mobile' | 'medium' | 'large' =
      width < MEDIUM_BREAKPOINT ? 'mobile' : width < LARGE_BREAKPOINT ? 'medium' : 'large';

    if (screenType === 'mobile') {
      this.lastScreenType = screenType;
      this.wasExpandedBeforeAutoCollapse = null;
      return;
    }

    if (screenType === this.lastScreenType) return;

    const collapsed = this.system.sidebarCollapsed();

    if (
      screenType === 'medium' &&
      (this.lastScreenType === 'large' || this.lastScreenType === null) &&
      !collapsed
    ) {
      if (this.wasExpandedBeforeAutoCollapse === null) this.wasExpandedBeforeAutoCollapse = true;
      this.system.setSidebarCollapsed(true);
    } else if (screenType === 'large' && this.lastScreenType === 'medium') {
      if (this.wasExpandedBeforeAutoCollapse === true && collapsed) {
        this.system.setSidebarCollapsed(false);
      }
    }

    this.lastScreenType = screenType;
  }
}
