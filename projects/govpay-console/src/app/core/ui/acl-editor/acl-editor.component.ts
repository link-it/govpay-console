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

import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ACL_SERVIZI, type Acl, type AclServizio, type Autorizzazione } from '@core/models';

/**
 * Editor ACL riusabile (Ruoli / Operatori / Applicazioni): per ogni servizio
 * due checkbox lettura (`R`) e scrittura (`W`). Il valore a due vie è un
 * `Acl[]` che include solo i servizi con almeno un'autorizzazione. `disabled`
 * lo rende una vista di sola lettura.
 *
 *   <lnk-acl-editor [(acl)]="aclValue" />
 *   <lnk-acl-editor [acl]="ruolo.acl" [disabled]="true" />
 */
@Component({
  selector: 'lnk-acl-editor',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-[var(--border)] overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)] text-xs font-semibold text-[var(--muted-foreground)]">
        <span>{{ 'Acl.Servizio' | translate }}</span>
        <span class="flex items-center gap-4">
          <span class="w-6 text-center">{{ 'Acl.R' | translate }}</span>
          <span class="w-6 text-center">{{ 'Acl.W' | translate }}</span>
        </span>
      </div>
      @for (s of servizi; track s) {
        <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] last:border-b-0 text-sm">
          <span>{{ s }}</span>
          <span class="flex items-center gap-4">
            <input
              type="checkbox"
              class="w-6 h-4 accent-[var(--primary)]"
              [attr.aria-label]="s + ' — ' + ('Acl.R' | translate)"
              [checked]="has(s, 'R')"
              [disabled]="disabled()"
              (change)="toggle(s, 'R', $any($event.target).checked)"
            />
            <input
              type="checkbox"
              class="w-6 h-4 accent-[var(--primary)]"
              [attr.aria-label]="s + ' — ' + ('Acl.W' | translate)"
              [checked]="has(s, 'W')"
              [disabled]="disabled()"
              (change)="toggle(s, 'W', $any($event.target).checked)"
            />
          </span>
        </div>
      }
    </div>
  `,
})
export class AclEditorComponent {
  /** Valore a due vie: entry ACL con almeno un'autorizzazione. */
  readonly acl = model<Acl[]>([]);
  /** Sola lettura (checkbox disabilitate). */
  readonly disabled = input<boolean>(false);

  protected readonly servizi = ACL_SERVIZI;

  protected has(servizio: AclServizio, auth: Autorizzazione): boolean {
    return this.acl().find((e) => e.servizio === servizio)?.autorizzazioni.includes(auth) ?? false;
  }

  protected toggle(servizio: AclServizio, auth: Autorizzazione, checked: boolean): void {
    const list = this.acl().map((e) => ({ ...e, autorizzazioni: [...e.autorizzazioni] }));
    let entry = list.find((e) => e.servizio === servizio);
    if (checked) {
      if (!entry) {
        entry = { servizio, autorizzazioni: [] };
        list.push(entry);
      }
      if (!entry.autorizzazioni.includes(auth)) entry.autorizzazioni.push(auth);
    } else if (entry) {
      entry.autorizzazioni = entry.autorizzazioni.filter((a) => a !== auth);
      if (entry.autorizzazioni.length === 0) list.splice(list.indexOf(entry), 1);
    }
    this.acl.set(list);
  }
}
