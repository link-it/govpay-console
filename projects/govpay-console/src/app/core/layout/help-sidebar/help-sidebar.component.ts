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
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SystemFacade } from '@core/system';

/**
 * Drawer laterale destro per aiuto contestuale.
 * Si apre con `SystemFacade.openHelp(context, section?)`.
 */
@Component({
  selector: 'lnk-help-sidebar',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-sidebar.component.html',
})
export class HelpSidebarComponent {
  private readonly system = inject(SystemFacade);
  private readonly translate = inject(TranslateService);

  readonly open = this.system.helpOpen;
  readonly ctx = this.system.helpContext;
  readonly title = computed(() =>
    this.translate.instant('Help.Title', { context: this.ctx()?.context ?? '—' })
  );

  close(): void {
    this.system.closeHelp();
  }
}
