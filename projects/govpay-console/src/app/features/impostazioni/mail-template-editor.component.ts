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

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, type Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SnackbarService, SystemFacade } from '@linkit/shared-ui';
import {
  DetailSectionComponent,
  FormActionBarComponent,
  LoadingComponent,
  PageHeaderComponent,
  ListStickyToolbarDirective,
} from '@linkit/shared-ui';
import { problemDetail } from '@core/models';
import { ImpostazioniConsoleApi } from './impostazioni.console-api';
import type { ImpostazioniMailTemplatePromemoria } from './impostazioni.model';

/**
 * Editor **Impostazioni → Template mail** (promemoria avviso/ricevuta/scadenza).
 * GET+ETag → PUT-replace con If-Match. Template FreeMarker (`tipo` fisso).
 */
@Component({
  selector: 'lnk-mail-template-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    LoadingComponent,
    ListStickyToolbarDirective,
    FormActionBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mail-template-editor.component.html',
})
export class MailTemplateEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ImpostazioniConsoleApi);
  private readonly router = inject(Router);
  private readonly system = inject(SystemFacade);
  private readonly snackbar = inject(SnackbarService);
  private readonly translate = inject(TranslateService);

  private etag: string | null = null;
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    avvisoOggetto: [''],
    avvisoMessaggio: [''],
    avvisoAllegaPdf: [false],
    ricevutaOggetto: [''],
    ricevutaMessaggio: [''],
    ricevutaSoloEseguiti: [false],
    ricevutaAllegaPdf: [false],
    scadenzaOggetto: [''],
    scadenzaMessaggio: [''],
    scadenzaPreavviso: [null as number | null],
  });

  ngOnInit(): void {
    this.system.setBreadcrumbs([
      { label: 'Nav.Impostazioni', url: '/impostazioni' },
      { label: 'Impostazioni.Aree.MailTemplate.Nome' },
    ]);
    this.loading.set(true);
    this.api
      .getMailTemplate()
      .pipe(
        catchError((err) => {
          this.snackbar.error(problemDetail(err, this.translate.instant('Common.LoadError')));
          this.router.navigate(['/impostazioni']);
          return of(null);
        })
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res?.body) return;
        this.etag = res.etag;
        const b = res.body;
        this.form.patchValue({
          avvisoOggetto: b.promemoriaAvviso?.oggetto ?? '',
          avvisoMessaggio: b.promemoriaAvviso?.messaggio ?? '',
          avvisoAllegaPdf: b.promemoriaAvviso?.allegaPdf ?? false,
          ricevutaOggetto: b.promemoriaRicevuta?.oggetto ?? '',
          ricevutaMessaggio: b.promemoriaRicevuta?.messaggio ?? '',
          ricevutaSoloEseguiti: b.promemoriaRicevuta?.soloEseguiti ?? false,
          ricevutaAllegaPdf: b.promemoriaRicevuta?.allegaPdf ?? false,
          scadenzaOggetto: b.promemoriaScadenza?.oggetto ?? '',
          scadenzaMessaggio: b.promemoriaScadenza?.messaggio ?? '',
          scadenzaPreavviso: b.promemoriaScadenza?.preavviso ?? null,
        });
      });
  }

  private buildBody(): ImpostazioniMailTemplatePromemoria {
    const r = this.form.getRawValue();
    const s = (v: string): string | undefined => v.trim() || undefined;
    return {
      promemoriaAvviso: { tipo: 'freemarker', oggetto: s(r.avvisoOggetto), messaggio: s(r.avvisoMessaggio), allegaPdf: r.avvisoAllegaPdf },
      promemoriaRicevuta: { tipo: 'freemarker', oggetto: s(r.ricevutaOggetto), messaggio: s(r.ricevutaMessaggio), soloEseguiti: r.ricevutaSoloEseguiti, allegaPdf: r.ricevutaAllegaPdf },
      promemoriaScadenza: { tipo: 'freemarker', oggetto: s(r.scadenzaOggetto), messaggio: s(r.scadenzaMessaggio), preavviso: r.scadenzaPreavviso ?? undefined },
    };
  }

  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api
      .putMailTemplate(this.buildBody(), this.etag)
      .pipe(catchError((err) => this.onError(err)))
      .subscribe((res) => {
        this.saving.set(false);
        if (!res) return;
        this.etag = res.etag;
        this.snackbar.success(this.translate.instant('Impostazioni.Salvato'));
      });
  }

  private onError(err: HttpErrorResponse): Observable<null> {
    this.saving.set(false);
    const key = err.status === 412 || err.status === 428 ? 'Impostazioni.ConflittoConcorrenza'
      : err.status === 422 ? 'Impostazioni.Invalido'
      : 'Impostazioni.SalvaErrore';
    this.snackbar.error(problemDetail(err, this.translate.instant(key)));
    return of(null);
  }
}
