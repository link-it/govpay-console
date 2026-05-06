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
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@core/auth';
import { SystemFacade } from '@core/system';
import {
  DetailSectionComponent,
  EmptyStateComponent,
  InfoGridComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  type InfoGridItem,
  ListStickyToolbarDirective,
} from '@shared';

@Component({
  selector: 'lnk-profilo',
  standalone: true,
  imports: [
    TranslatePipe,
    PageHeaderComponent,
    DetailSectionComponent,
    InfoGridComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ListStickyToolbarDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profilo.component.html',
})
export class ProfiloComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly system = inject(SystemFacade);

  readonly user = this.auth.user;

  readonly anagraficaItems = computed<InfoGridItem[]>(() => {
    const u = this.user();
    if (!u) return [];
    return [
      { labelKey: 'Profilo.Detail.Nome', value: u.displayName, wide: true, hide: !u.displayName },
      { labelKey: 'Profilo.Detail.Username', value: u.username, mono: true },
      { labelKey: 'Profilo.Detail.Email', value: u.email, hide: !u.email },
      { labelKey: 'Profilo.Detail.Autenticazione', value: u.autenticazione, hide: !u.autenticazione },
    ];
  });

  readonly dominiList = computed<{ idDominio: string; ragioneSociale?: string }[]>(() => {
    const u = this.user();
    return u?.domini ?? [];
  });

  readonly tipiPendenzaList = computed<{ idTipoPendenza: string; descrizione?: string }[]>(() => {
    const u = this.user();
    return u?.tipiPendenza ?? [];
  });

  readonly aclList = computed(() => this.user()?.aclRaw ?? []);

  ngOnInit(): void {
    this.system.setBreadcrumbs([{ label: 'Nav.Profilo' }]);
  }

  hasRead(autorizzazioni: string[]): boolean {
    return autorizzazioni?.includes('R');
  }
  hasWrite(autorizzazioni: string[]): boolean {
    return autorizzazioni?.includes('W');
  }
}
