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
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@core/auth';
import { ConfigService } from '@core/config';
import type { ExtraMenuItem } from '@core/config';

/**
 * Componente per il menu profilo nel footer della sidebar.
 *
 * Comportamenti:
 *   - Utente non autenticato: mostra il pulsante "Accedi" che porta a `/auth/login`.
 *   - Utente autenticato (sidebar espansa): blocco con avatar + nome + chevron;
 *     click apre il dropup (`bottom-full mb-2`) con voci profilo / impostazioni / logout.
 *   - Utente autenticato (sidebar collassata): solo l'avatar; click apre il flyout
 *     a destra del bottone (posizionato `fixed` per non venire clippato).
 */
@Component({
  selector: 'lnk-profile-menu',
  standalone: true,
  imports: [RouterLink, NgIcon, NgTemplateOutlet, TranslatePipe, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-menu.component.html',
})
export class ProfileMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly config = inject(ConfigService);

  readonly collapsed = input<boolean>(false);

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly isOpen = signal(false);
  readonly flyoutLeft = signal(0);
  readonly flyoutBottom = signal(0);

  /** Mostra la voce About (default `true`, controllata da `Layout.showAbout`). */
  readonly showAbout = computed(() => this.config.appConfig()?.Layout.showAbout !== false);
  /** Voci aggiuntive configurate da `Layout.profileMenuExtraItems`. */
  readonly extraItems = computed<ExtraMenuItem[]>(
    () => this.config.appConfig()?.Layout.profileMenuExtraItems ?? []
  );

  /** True se il link è esterno (http/https/mailto/tel). */
  isExternalLink(href: string): boolean {
    return /^(https?:|mailto:|tel:)/i.test(href);
  }

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    const name = u.displayName || u.username || '';
    return name
      .split(' ')
      .map((p) => p[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  });

  toggle(event: Event): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      return;
    }
    if (this.collapsed()) {
      const trigger = event.currentTarget as HTMLElement;
      const rect = trigger.getBoundingClientRect();
      this.flyoutLeft.set(rect.right);
      this.flyoutBottom.set(window.innerHeight - rect.bottom);
    }
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  async logout(): Promise<void> {
    this.close();
    await this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (!this.isOpen()) return;
    const el = this.host.nativeElement as HTMLElement;
    if (target instanceof Node && !el.contains(target)) this.isOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.isOpen.set(false);
  }
}
