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

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, InfoGridComponent, type InfoGridItem } from '@linkit/shared-ui';
import { problemDetail, type ConnettoreCredenziali } from '@core/models';
import { InlineEditCardComponent } from '@core/ui/inline-edit-card/inline-edit-card.component';
import { SelectComponent } from '@core/ui/select/select.component';
import { DominiConsoleApi } from './domini.console-api';
import type { ConnettoreDominio, ConnettoreDominioDescriptor } from './connettore-dominio.model';

/** Campi credenziali (write-only) esposti nella sotto-form. */
const CREDENZIALI_FIELDS: { key: keyof ConnettoreCredenziali; labelKey: string }[] = [
  { key: 'subscriptionKey', labelKey: 'Domini.Connettori.Cred.SubscriptionKey' },
  { key: 'password', labelKey: 'Domini.Connettori.Cred.Password' },
  { key: 'apiKey', labelKey: 'Domini.Connettori.Cred.ApiKey' },
  { key: 'clientSecret', labelKey: 'Domini.Connettori.Cred.ClientSecret' },
  { key: 'headerValue', labelKey: 'Domini.Connettori.Cred.HeaderValue' },
];

/**
 * Card view/edit inline di un connettore singleton del dominio, guidata dal
 * {@link ConnettoreDominioDescriptor}. Le sotto-strutture non modellate
 * (`auth`, `contenuti`, …) sono preservate as-is nel replace.
 */
@Component({
  selector: 'lnk-connettore-dominio-inline',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, InfoGridComponent, InlineEditCardComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './connettore-dominio-inline.component.html',
})
export class ConnettoreDominioInlineComponent implements OnInit {
  private readonly api = inject(DominiConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  readonly idDominio = input.required<string>();
  readonly descriptor = input.required<ConnettoreDominioDescriptor>();

  readonly credenzialiFields = CREDENZIALI_FIELDS;

  private etag: string | null = null;
  private loaded: ConnettoreDominio | null = null;

  readonly ready = signal(false);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly abilitato = signal(false);

  readonly showCredenziali = signal(false);
  readonly savingCredenziali = signal(false);

  readonly statusTone = computed<'success' | 'muted'>(() => (this.abilitato() ? 'success' : 'muted'));
  readonly statusLabel = computed(() => this.translate.instant(this.abilitato() ? 'Common.Yes' : 'Common.No'));

  /** Form dinamica: `abilitato` + un controllo per ogni campo del descrittore. */
  form = new FormGroup<Record<string, FormControl>>({ abilitato: new FormControl(false, { nonNullable: true }) });
  readonly credenzialiForm = new FormGroup<Record<string, FormControl>>(
    Object.fromEntries(CREDENZIALI_FIELDS.map((f) => [f.key, new FormControl('', { nonNullable: true })])),
  );

  readonly viewItems = computed<InfoGridItem[]>(() => {
    // dipende da `ready` per ricomputare dopo il load
    if (!this.ready()) return [];
    const src: Record<string, unknown> = this.loaded ?? {};
    const items: InfoGridItem[] = [{ labelKey: 'Domini.Connettori.Abilitato', value: this.translate.instant(this.abilitato() ? 'Common.Yes' : 'Common.No') }];
    for (const f of this.descriptor().fields) {
      const raw = src[f.key];
      if (raw === undefined || raw === null || raw === '') continue;
      let value: string;
      if (f.kind === 'checkbox') value = this.translate.instant(raw ? 'Common.Yes' : 'Common.No');
      else if (f.kind === 'list' && Array.isArray(raw)) value = raw.join(', ');
      else value = String(raw);
      items.push({ labelKey: f.labelKey, value, wide: f.kind === 'list' });
    }
    return items;
  });

  ngOnInit(): void {
    for (const f of this.descriptor().fields) {
      const init = f.kind === 'checkbox' ? false : f.kind === 'number' ? null : '';
      this.form.addControl(f.key, new FormControl(init, { nonNullable: f.kind !== 'number' }));
    }
    this.fetch();
  }

  private fetch(): void {
    this.api
      .getConnettoreWithETag(this.idDominio(), this.descriptor().tipo)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.body) {
          this.etag = res.etag;
          this.loaded = res.body;
          this.patchFromLoaded();
        }
        this.ready.set(true);
      });
  }

  private patchFromLoaded(): void {
    const b = this.loaded ?? { abilitato: false };
    this.abilitato.set(!!b.abilitato);
    const patch: Record<string, unknown> = { abilitato: !!b.abilitato };
    for (const f of this.descriptor().fields) {
      const raw = b[f.key];
      if (f.kind === 'list') patch[f.key] = Array.isArray(raw) ? raw.join('\n') : '';
      else if (f.kind === 'checkbox') patch[f.key] = !!raw;
      else if (f.kind === 'number') patch[f.key] = raw ?? null;
      else patch[f.key] = raw ?? '';
    }
    this.form.patchValue(patch, { emitEvent: false });
  }

  onCancel(): void {
    this.patchFromLoaded();
  }

  private buildBody(): ConnettoreDominio {
    const v = this.form.getRawValue();
    // preserva i campi non modellati (auth, contenuti, …)
    const known = new Set(['abilitato', ...this.descriptor().fields.map((f) => f.key)]);
    const preserved: Record<string, unknown> = {};
    if (this.loaded) {
      for (const [k, val] of Object.entries(this.loaded)) {
        if (!known.has(k)) preserved[k] = val;
      }
    }
    const body: ConnettoreDominio = { ...preserved, abilitato: !!v['abilitato'] };
    for (const f of this.descriptor().fields) {
      const raw = v[f.key];
      if (f.kind === 'list') {
        const arr = String(raw ?? '')
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (arr.length) body[f.key] = arr;
      } else if (f.kind === 'checkbox') {
        body[f.key] = !!raw;
      } else if (f.kind === 'number') {
        if (raw !== null && raw !== '' && raw !== undefined) body[f.key] = Number(raw);
      } else {
        const s = String(raw ?? '').trim();
        if (s) body[f.key] = s;
      }
    }
    return body;
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api
      .replaceConnettore(this.idDominio(), this.descriptor().tipo, this.buildBody(), this.etag)
      .pipe(catchError((err) => this.onError(err)))
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.loaded = res.body;
        this.abilitato.set(!!res.body.abilitato);
        this.snackbar.success(this.translate.instant('Domini.Connettori.Aggiornato'));
        this.editing.set(false);
      });
  }

  saveCredenziali(): void {
    if (this.savingCredenziali()) return;
    const raw = this.credenzialiForm.getRawValue();
    const body: ConnettoreCredenziali = {};
    for (const f of CREDENZIALI_FIELDS) {
      const s = String(raw[f.key] ?? '').trim();
      if (s) (body as Record<string, string>)[f.key] = s;
    }
    this.savingCredenziali.set(true);
    this.api
      .putCredenzialiConnettore(this.idDominio(), this.descriptor().tipo, body)
      .pipe(catchError((err) => {
        this.savingCredenziali.set(false);
        this.snackbar.error(problemDetail(err, this.translate.instant('Domini.Connettori.Cred.Errore')));
        return of(null);
      }))
      .subscribe((res) => {
        this.savingCredenziali.set(false);
        if (res === null) return;
        this.credenzialiForm.reset();
        this.showCredenziali.set(false);
        this.snackbar.success(this.translate.instant('Domini.Connettori.Cred.Aggiornate'));
      });
  }

  private onError(err: HttpErrorResponse) {
    this.saving.set(false);
    const key = err.status === 412 || err.status === 428 ? 'Domini.Form.ConflittoConcorrenza' : 'Domini.Connettori.SalvaErrore';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
