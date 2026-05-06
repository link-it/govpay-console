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

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { VERSION, getFullVersion } from '@environments';

@Component({
  selector: 'lnk-about',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6 max-w-2xl">
      <h2 class="text-xl font-semibold mb-4">{{ 'About.Title' | translate }}</h2>
      <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        <dt class="font-medium opacity-70">{{ 'About.Version' | translate }}</dt>
        <dd>{{ fullVersion }}</dd>
        <dt class="font-medium opacity-70">{{ 'About.Build' | translate }}</dt>
        <dd>{{ version.buildDate }}</dd>
        <dt class="font-medium opacity-70">{{ 'About.Branch' | translate }}</dt>
        <dd>{{ version.gitBranch }}</dd>
        <dt class="font-medium opacity-70">{{ 'About.Commit' | translate }}</dt>
        <dd class="font-mono">{{ version.gitHashFull }}</dd>
        @if (version.gitTag) {
          <dt class="font-medium opacity-70">{{ 'About.Tag' | translate }}</dt>
          <dd>{{ version.gitTag }}</dd>
        }
        @if (version.gitDirty) {
          <dt class="font-medium opacity-70">{{ 'About.Status' | translate }}</dt>
          <dd class="text-[var(--warning)]">{{ 'About.Dirty' | translate }}</dd>
        }
      </dl>
    </section>
  `,
})
export class AboutComponent {
  readonly version = VERSION;
  readonly fullVersion = getFullVersion();
}
