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
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfigService } from '@core/config';
import { AuthService } from '@core/auth';
import {
  ColorSchemeToggleComponent,
  GlobalTweaksHostComponent,
  LanguageMenuComponent,
  TweaksRegistry,
} from '@core/ui';
import { SnackbarService } from '@core/ui/snackbar/snackbar.service';
import { environment } from '@environment';
import type { AuthMode } from '@core/config';

@Component({
  selector: 'lnk-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    LanguageMenuComponent,
    ColorSchemeToggleComponent,
    GlobalTweaksHostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styles: `
    /*
     * Stili della card di login. Usate classi custom invece dei
     * conditional [class.bg-[var(--xx)]] perché Tailwind 4 non genera
     * sempre la regola escapata nei binding [class.x] (vedi feedback
     * memo del progetto).
     */
    .lnk-auth-card {
      padding: 1.5rem;
      background: var(--card-bg);
      border: 1px solid var(--btn-secondary-border);
      border-radius: 0.5rem;
      box-shadow: var(--card-shadow);
    }
    /* Variante senza box: nessuno sfondo/bordo/ombra; rimosso anche il
       padding-top (i contenuti sono allineati alla riga sotto l'header). */
    .lnk-auth-cardless {
      padding: 0 1.5rem 1.5rem;
    }
  `,
})
export class LoginComponent {
  private readonly config = inject(ConfigService);
  private readonly auth = inject(AuthService);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly logo = computed(() => this.config.branding()?.logo.full ?? '');
  readonly title = computed(() => this.config.appConfig()?.app?.title ?? 'GovPay Console');
  readonly authModes = computed<AuthMode[]>(() => this.config.appConfig()?.Auth.Modes ?? []);
  readonly defaultMode = computed<AuthMode>(() => this.config.appConfig()?.Auth.Default ?? 'Basic');
  readonly selectedMode = signal<AuthMode>(this.defaultMode());
  readonly loading = this.auth.loading;
  readonly error = this.auth.error;
  /** Mostra il pulsante "Mock login" solo in dev. */
  readonly showMockLogin = !environment.production;

  /**
   * Variante "cardless": rimuove la card centrale (background, bordo,
   * shadow, padding), mostrando il form direttamente sul background.
   * Pilotata dal pannello tweaks; default `false`.
   */
  readonly cardless = signal<boolean>(false);

  /**
   * Mostra `<lnk-language-menu>` nell'header se ci sono lingue
   * disponibili E `languageSelectorPosition !== 'none'`. Letto da
   * `effectiveLayout()` per rispettare gli override del tweaks panel.
   */
  readonly showLanguageMenu = computed(() => {
    const layout = this.config.effectiveLayout();
    const hasMulti = (layout?.languages?.length ?? 0) > 1;
    const pos = layout?.languageSelectorPosition ?? 'header';
    return hasMulti && pos !== 'none';
  });
  /**
   * Mostra il toggle dark/light se `darkModeTogglePosition !== 'none'`.
   * Letto da `effectiveLayout()` per rispettare gli override del tweaks
   * panel.
   */
  readonly showDarkToggle = computed(
    () => this.config.effectiveLayout()?.darkModeTogglePosition !== 'none'
  );

  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  /**
   * Sezione "Login" del pannello tweaks: opzioni di rendering della
   * pagina di login (per ora solo `cardless`). Cleanup auto-bound al
   * `DestroyRef` del component.
   */
  constructor() {
    const tweaks = inject(TweaksRegistry);
    inject(DestroyRef).onDestroy(
      tweaks.register({
        id: 'login',
        titleKey: 'Tweaks.Login',
        rows: [
          {
            type: 'toggle',
            labelKey: 'Tweaks.Cardless',
            hintKey: 'Tweaks.CardlessHint',
            value: this.cardless,
            onChange: (v) => this.cardless.set(v),
          },
        ],
        onReset: () => this.cardless.set(false),
      })
    );
  }

  selectMode(mode: AuthMode): void {
    this.selectedMode.set(mode);
  }

  async submitBasic(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    try {
      await this.auth.loginBasic(username, password);
      this.snackbar.success(this.translate.instant('Auth.Success'));
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch {
      this.snackbar.error(this.auth.error() ?? this.translate.instant('Auth.Failed'));
    }
  }

  startRedirect(mode: 'Spid' | 'Iam' | 'OAuth2'): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.auth.startRedirectLogin(mode, returnUrl);
  }

  mockLogin(): void {
    const user = this.auth.mockLogin();
    this.snackbar.success(
      this.translate.instant('Auth.MockLoginDone', { name: user.displayName ?? user.username })
    );
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    this.router.navigateByUrl(returnUrl);
  }
}
