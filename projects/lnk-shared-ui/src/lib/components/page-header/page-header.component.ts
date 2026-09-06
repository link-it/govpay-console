/*
 * Copyright (c) 2014-2026 Link.it srl (http://www.link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { formatNumber } from '../../utils';
import { LoadingComponent } from '../loading/loading.component';

export type PageHeaderTitleSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;

// Tailwind size class per preset. Default `xl` mantiene `text-2xl` del
// layout originale. Per dimensioni custom passare una stringa CSS
// arbitraria (es. `'text-[28px]'`, `'text-4xl'`) o un nome Tailwind
// non incluso nei preset.
const TITLE_SIZE_PRESETS: Record<string, string> = {
  sm:    'text-base',
  md:    'text-lg',
  lg:    'text-xl',
  xl:    'text-2xl',
  '2xl': 'text-3xl',
};

/**
 * Intestazione di una pagina di feature: titolo grande + sottotitolo opzionale.
 *
 * Le azioni (pulsanti) si proiettano via slot:
 *
 *   <lnk-page-header titleKey="Nav.Pendenze" subtitleKey="Pendenze.Subtitle" [total]="total()">
 *     <button class="btn btn-primary">Nuova</button>
 *   </lnk-page-header>
 *
 *   <lnk-page-header titleKey="Reports.Detail" titleSize="lg" />
 */
@Component({
  selector: 'lnk-page-header',
  standalone: true,
  imports: [TranslatePipe, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex items-start justify-between gap-4 mb-4">
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline gap-2 min-w-0">
          <h1 class="font-semibold break-words" [class]="titleSizeClass()">{{ titleKey() | translate }}</h1>
          @if (loading()) {
            <lnk-loading [inline]="true" size="sm" [labelKey]="null" />
          } @else if (totalLabel(); as t) {
            <span class="text-sm font-medium text-[var(--muted-foreground)] tabular-nums whitespace-nowrap">{{ t }}</span>
          } @else if (countOnRequest()) {
            @if (countLoading()) {
              <lnk-loading [inline]="true" size="sm" [labelKey]="null" />
            } @else {
              <button type="button" class="text-sm font-medium text-[var(--primary)] hover:underline whitespace-nowrap"
                (click)="requestCount.emit()">{{ showTotalKey() | translate }}</button>
            }
          }
        </div>
        @if (subtitleKey(); as key) {
          <p class="text-sm text-[var(--muted-foreground)] mt-1">{{ key | translate }}</p>
        }
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly titleKey = input.required<string>();
  readonly subtitleKey = input<string | undefined>(undefined);
  /** Totale risultati (mostrato accanto al titolo, formattato con separatore migliaia). */
  readonly total = input<number | null | undefined>(null);
  /** Se `true` sostituisce il counter con uno spinner inline. */
  readonly loading = input<boolean, unknown>(false, { transform: booleanAttribute });
  /**
   * Se `true` e `total` è ancora `null`, al posto del counter mostra un pulsante
   * "mostra totale" che emette `requestCount`. Utile per risorse grandi dove il
   * conteggio è costoso e va richiesto esplicitamente.
   */
  readonly countOnRequest = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Spinner al posto del pulsante mentre il conteggio on-demand è in corso. */
  readonly countLoading = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Chiave i18n del pulsante "mostra totale". */
  readonly showTotalKey = input<string>('Common.ShowTotal');
  /** Emesso al click su "mostra totale": il consumer esegue il conteggio. */
  readonly requestCount = output<void>();
  /**
   * Dimensione del titolo. Preset (`sm` | `md` | `lg` | `xl` | `2xl`)
   * o stringa Tailwind arbitraria (es. `'text-3xl'`, `'text-[28px]'`).
   * Default `'xl'` → `text-2xl` (comportamento storico).
   */
  readonly titleSize = input<PageHeaderTitleSize>('xl');

  protected readonly totalLabel = computed(() => {
    const t = this.total();
    return t == null ? null : formatNumber(t);
  });

  /** Classe Tailwind risolta dal preset o passata as-is. */
  protected readonly titleSizeClass = computed(() => {
    const s = this.titleSize();
    return TITLE_SIZE_PRESETS[s] ?? s;
  });
}
