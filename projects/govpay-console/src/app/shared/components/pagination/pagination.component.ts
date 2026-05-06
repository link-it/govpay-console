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

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

/**
 * Controlli di paginazione: range di righe + selettore pageSize + frecce.
 *
 * Tutti i valori sono **1-based** per allineamento con le API GovPay
 * (`pagina: 1` per la prima).
 */
@Component({
  selector: 'lnk-pagination',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-3 px-2 py-3 text-sm">
      <div class="flex items-center gap-2 text-[var(--muted-foreground)]">
        <span>{{ 'Pagination.RowsPerPage' | translate }}</span>
        <select
          class="px-2 py-1 rounded border border-[var(--border)] bg-[var(--card-bg)]"
          [value]="pageSize()"
          (change)="onPageSizeChange($event)"
          [attr.aria-label]="'Pagination.RowsPerPage' | translate"
        >
          @for (size of pageSizes(); track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>
      </div>

      <div class="flex-1 text-center text-[var(--muted-foreground)]">
        @if (total() > 0) {
          {{ 'Pagination.RangeOf' | translate: { from: rangeFrom(), to: rangeTo(), total: total() } }}
        } @else {
          {{ 'Pagination.NoResults' | translate }}
        }
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          [disabled]="page() <= 1"
          (click)="goTo(1)"
          [attr.aria-label]="'Pagination.First' | translate"
          [title]="'Pagination.First' | translate"
        >
          <ng-icon name="bootstrapChevronLeft" size="1rem" />
          <ng-icon name="bootstrapChevronLeft" size="1rem" class="-ml-2" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          [disabled]="page() <= 1"
          (click)="goTo(page() - 1)"
          [attr.aria-label]="'Pagination.Previous' | translate"
          [title]="'Pagination.Previous' | translate"
        >
          <ng-icon name="bootstrapChevronLeft" size="1rem" />
        </button>
        <span class="px-2 font-medium">
          {{ page() }} / {{ totalPages() }}
        </span>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          [disabled]="page() >= totalPages()"
          (click)="goTo(page() + 1)"
          [attr.aria-label]="'Pagination.Next' | translate"
          [title]="'Pagination.Next' | translate"
        >
          <ng-icon name="bootstrapChevronRight" size="1rem" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-icon"
          [disabled]="page() >= totalPages()"
          (click)="goTo(totalPages())"
          [attr.aria-label]="'Pagination.Last' | translate"
          [title]="'Pagination.Last' | translate"
        >
          <ng-icon name="bootstrapChevronRight" size="1rem" />
          <ng-icon name="bootstrapChevronRight" size="1rem" class="-ml-2" />
        </button>
      </div>
    </div>
  `,
})
export class PaginationComponent {
  readonly page = input<number>(1);
  readonly pageSize = input<number>(25);
  readonly total = input<number>(0);
  readonly pageSizes = input<number[]>(DEFAULT_PAGE_SIZES);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => {
    const t = this.total();
    const s = this.pageSize();
    if (t <= 0 || s <= 0) return 1;
    return Math.max(1, Math.ceil(t / s));
  });

  readonly rangeFrom = computed(() => {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  readonly rangeTo = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  goTo(page: number): void {
    const target = Math.min(Math.max(1, page), this.totalPages());
    if (target !== this.page()) this.pageChange.emit(target);
  }

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value) && value !== this.pageSize()) {
      this.pageSizeChange.emit(value);
    }
  }
}
