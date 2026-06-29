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
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Input di ricerca con debounce + icona + clear button.
 *
 *   <lnk-search-input
 *     [value]="search()"
 *     placeholderKey="Common.Search"
 *     (valueChange)="onSearchChange($event)"
 *   />
 *
 * - Debounce default 300ms (override via `debounce` input).
 * - Emette `valueChange` solo dopo che l'utente smette di digitare.
 * - Clear button visibile quando il valore non è vuoto.
 */
@Component({
  selector: 'lnk-search-input',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <span
        class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none"
      >
        <ng-icon name="bootstrapSearch" size="1rem" />
      </span>
      <input
        type="search"
        class="w-full pl-9 pr-9 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        [value]="local()"
        [placeholder]="placeholderKey() | translate"
        [attr.aria-label]="placeholderKey() | translate"
        (input)="onInput($event)"
        (keydown.escape)="clear()"
      />
      @if (local()) {
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          (click)="clear()"
          [attr.aria-label]="'Common.Clear' | translate"
          [title]="'Common.Clear' | translate"
        >
          <ng-icon name="bootstrapX" size="0.875rem" />
        </button>
      }
    </div>
  `,
})
export class SearchInputComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input<string>('');
  readonly placeholderKey = input<string>('Common.Search');
  readonly debounce = input<number>(300);

  readonly valueChange = output<string>();

  /** Buffer locale aggiornato a ogni keystroke; emette dopo `debounce` ms. */
  readonly local = signal<string>('');

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Sincronizza buffer locale quando il parent reset-a il valore (es. clear filtri).
    effect(() => {
      this.local.set(this.value());
    });
    this.destroyRef.onDestroy(() => {
      if (this.timer) clearTimeout(this.timer);
    });
  }

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.local.set(v);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.valueChange.emit(v), this.debounce());
  }

  clear(): void {
    this.local.set('');
    if (this.timer) clearTimeout(this.timer);
    this.valueChange.emit('');
  }
}
