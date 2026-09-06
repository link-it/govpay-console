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
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@linkit/shared-ui';
import { problemDetail, type Slice } from '@core/models';
import { PagopaConsoleApi } from './pagopa.console-api';
import type { EnteCreditore, EnteCreditoreSummary } from './pagopa.model';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_CHARS = 2;
const SEARCH_LIMIT = 10;

/**
 * Typeahead di lookup **Enti creditori pagoPA** (censimento assistito).
 * Cerca su `/pagopa/enti-creditori` mentre si digita; alla selezione risolve
 * l'anagrafica completa (`/{taxCode}`) ed emette `selected` per precompilare
 * il form chiamante (es. Dominio). Read-only, nessuno stato di form proprio.
 */
@Component({
  selector: 'lnk-ente-creditore-lookup',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ente-creditore-lookup.component.html',
})
export class EnteCreditoreLookupComponent {
  private readonly api = inject(PagopaConsoleApi);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  /** Emette l'anagrafica completa dell'ente selezionato. */
  readonly selected = output<EnteCreditore>();

  readonly query = signal('');
  readonly results = signal<EnteCreditoreSummary[]>([]);
  readonly loading = signal(false);
  readonly open = signal(false);
  readonly resolving = signal(false);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.trim().length < SEARCH_MIN_CHARS) {
            this.loading.set(false);
            return of<Slice<EnteCreditoreSummary>>({ results: [] });
          }
          this.loading.set(true);
          return this.api.listEntiCreditori({ search: q.trim(), limit: SEARCH_LIMIT }).pipe(
            catchError((err) => {
              this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
              return of<Slice<EnteCreditoreSummary>>({ results: [] });
            })
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((slice) => {
        this.results.set(slice.results ?? []);
        this.loading.set(false);
        this.open.set(true);
      });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.search$.next(value);
  }

  onBlur(): void {
    // Ritardo per lasciar passare il click su un risultato prima di chiudere.
    setTimeout(() => this.open.set(false), 150);
  }

  onFocus(): void {
    if (this.results().length) this.open.set(true);
  }

  pick(ente: EnteCreditoreSummary): void {
    this.open.set(false);
    this.query.set(`${ente.companyName} (${ente.taxCode})`);
    this.resolving.set(true);
    this.api
      .getEnteCreditore(ente.taxCode)
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          return of(null);
        })
      )
      .subscribe((full) => {
        this.resolving.set(false);
        if (full) this.selected.emit(full);
      });
  }
}
