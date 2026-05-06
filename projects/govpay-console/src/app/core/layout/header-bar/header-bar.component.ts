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
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfigService } from '@core/config';
import { SystemFacade } from '@core/system';
import { AuthService } from '@core/auth';
import { ColorSchemeToggleComponent } from '@core/ui/color-scheme-toggle/color-scheme-toggle.component';
import { LanguageMenuComponent } from '@core/ui/language-menu/language-menu.component';

const SCROLL_THRESHOLD = 8;

/**
 * Header bar in stile GovHub:
 *   - **Sticky** in alto: l'host element ha `position: sticky` così il `<header>`
 *     interno si appoggia correttamente sul viewport.
 *   - **Trasparente** quando la pagina è in cima.
 *   - **Bianco semi-trasparente con blur + bordo** quando la pagina scrolla.
 *   - Renderizzato **solo se ha contenuto** (`hasContent`).
 */
@Component({
  selector: 'lnk-header-bar',
  standalone: true,
  imports: [RouterLink, NgIcon, TranslatePipe, ColorSchemeToggleComponent, LanguageMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header-bar.component.html',
  // L'host element occupa il proprio slot e diventa lui stesso il contenitore
  // sticky: questo evita che `<lnk-header-bar>` (di default `display: inline`)
  // breaki lo `position: sticky` interno.
  host: {
    class: 'block sticky top-0 z-30',
  },
})
export class HeaderBarComponent {
  private readonly config = inject(ConfigService);
  private readonly system = inject(SystemFacade);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly breadcrumbs = this.system.breadcrumbs;
  readonly title = computed(() => this.config.appConfig()?.app?.title ?? 'GovPay Console');

  readonly showProfileInHeader = computed(
    () => this.config.effectiveLayout()?.profileMenuPosition === 'header'
  );
  readonly showDarkToggle = computed(() => {
    const pos = this.config.effectiveLayout()?.darkModeTogglePosition ?? 'header';
    return pos === 'header';
  });
  readonly showLanguageMenu = computed(() => {
    const pos = this.config.effectiveLayout()?.languageSelectorPosition ?? 'header';
    return pos === 'header';
  });
  readonly showHelpButton = computed(
    () => this.config.effectiveLayout()?.helpButton !== false
  );

  /** True se l'header ha qualcosa da mostrare (oggi help+hamburger sempre presenti). */
  readonly hasContent = computed(
    () =>
      this.breadcrumbs().length > 0 ||
      this.showLanguageMenu() ||
      this.showDarkToggle() ||
      this.showProfileInHeader() ||
      true
  );

  private readonly _scrolled = signal(false);
  /** True quando `window.scrollY > SCROLL_THRESHOLD`: attiva il background frosted. */
  readonly scrolled = this._scrolled.asReadonly();

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    const next = y > SCROLL_THRESHOLD;
    if (next !== this._scrolled()) this._scrolled.set(next);
  }

  toggleMobileMenu(): void {
    this.system.toggleMobileMenu();
  }

  openHelp(): void {
    const ctx = this.breadcrumbs()[0]?.label ?? 'generic';
    this.system.openHelp(ctx);
  }
}
