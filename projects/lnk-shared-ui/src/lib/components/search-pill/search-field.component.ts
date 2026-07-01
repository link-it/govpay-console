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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { SearchField, SearchPillLabels, DEFAULT_LABELS } from './search-pill.types';

/**
 * Un controllo filtro guidato da un `SearchField`:
 *  - `text`   → input con label flottante e bottone clear
 *  - `select` con poche opzioni → segmented control inline
 *  - `select` con molte opzioni → dropdown (searchable quando lungo)
 *
 *   <lnk-search-field [field]="f" [(value)]="filters[f.id]" />
 */
@Component({
  selector: 'lnk-search-field',
  standalone: true,
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fld" [attr.data-focus]="focused() ? '1' : '0'" [class.fld--plain]="isSegmented()">
      <div class="fld__label">
        @if (field().icon) {
          <ng-icon [name]="field().icon!" size="0.7rem" />
        }
        {{ field().label }}
      </div>

      <!-- TEXT -->
      @if (field().kind === 'text') {
        <div class="fld__control" (click)="txt.focus()">
          <input
            #txt
            type="text"
            class="fld__input"
            [value]="value()"
            [placeholder]="field().placeholder ?? 'Digita per cercare…'"
            (input)="value.set($any($event.target).value)"
            (focus)="focused.set(true)"
            (blur)="focused.set(false)"
          />
          @if (value()) {
            <button type="button" class="fld__clear" aria-label="Cancella"
              (mousedown)="$event.preventDefault()" (click)="value.set('')">
              <ng-icon name="bootstrapX" size="0.7rem" />
            </button>
          }
        </div>
      }

      <!-- SEGMENTED -->
      @else if (isSegmented()) {
        <div class="fld__control fld__control--auto">
          <div class="seg" role="tablist">
            @for (o of field().options; track o) {
              <button type="button" role="tab" [attr.data-on]="value() === o ? '1' : '0'"
                (click)="value.set(o)">{{ o }}</button>
            }
          </div>
        </div>
      }

      <!-- SELECT (dropdown) -->
      @else {
        <div class="fld__control">
          <button type="button" class="fld__trigger" [attr.data-empty]="value() ? '0' : '1'"
            (click)="toggleOpen()">
            <span class="fld__trigger-text">{{ value() || field().placeholder || 'Seleziona…' }}</span>
            <ng-icon name="bootstrapChevronDown" size="0.9rem" class="fld__chev" [class.fld__chev--open]="open()" />
          </button>
          @if (value()) {
            <button type="button" class="fld__clear" aria-label="Cancella"
              (click)="$event.stopPropagation(); value.set('')">
              <ng-icon name="bootstrapX" size="0.7rem" />
            </button>
          }

          @if (open()) {
            <div class="menu">
              @if (searchable()) {
                <div class="menu__search">
                  <ng-icon name="bootstrapSearch" size="0.9rem" />
                  <input #q autofocus type="text" [placeholder]="labels().optionsFilter"
                    (input)="filterText.set($any($event.target).value)" />
                </div>
              }
              <div class="menu__list">
                @for (o of filteredOptions(); track o) {
                  <button type="button" class="menu__item"
                    [class.menu__item--active]="o === value()"
                    [class.menu__item--empty]="!o"
                    (click)="pick(o)">
                    @if (field().icon && o) {
                      <ng-icon [name]="field().icon!" size="1rem" class="menu__icon" />
                    }
                    <span class="menu__label">{{ o || labels().none }}</span>
                    @if (o === value()) { <ng-icon name="bootstrapCheck2" size="0.95rem" class="menu__check" /> }
                  </button>
                }
                @if (filteredOptions().length === 0) {
                  <div class="menu__empty">Nessuna opzione</div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .fld {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 14px 8px;
      background: var(--sb-surface);
      border: 1px solid var(--sb-border);
      border-radius: 10px;
      transition: border-color .15s, box-shadow .15s, background .15s;
      cursor: text;
    }
    .fld:hover { border-color: var(--sb-border-strong); }
    .fld[data-focus='1'] {
      border-color: var(--sb-primary);
      box-shadow: 0 0 0 4px var(--sb-primary-soft);
    }
    .fld--plain { cursor: default; }

    .fld__label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .03em;
      text-transform: uppercase;
      color: var(--sb-text-muted);
      transition: color .12s;
    }
    .fld[data-focus='1'] .fld__label { color: var(--sb-primary); }

    .fld__control {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 22px;
    }
    .fld__control--auto { height: auto; }

    .fld__input {
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 0;
      border: none;
      outline: none;
      background: transparent;
      font: inherit;
      font-size: 14.5px;
      font-weight: 500;
      color: var(--sb-text);
    }
    .fld__input::placeholder { color: var(--sb-text-subtle); font-weight: 400; }

    .fld__trigger {
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0;
      border: none;
      background: transparent;
      font: inherit;
      font-size: 14.5px;
      font-weight: 500;
      color: var(--sb-text);
      text-align: left;
      cursor: pointer;
    }
    .fld__trigger[data-empty='1'] { color: var(--sb-text-subtle); font-weight: 400; }
    .fld__trigger-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fld__chev { color: var(--sb-text-muted); transition: transform .15s; }
    .fld__chev--open { transform: rotate(180deg); }

    .fld__clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 999px;
      background: var(--sb-chip);
      color: var(--sb-text-muted);
      cursor: pointer;
      transition: background .12s;
    }
    .fld__clear:hover { background: var(--sb-chip-hover); color: var(--sb-text); }

    .seg {
      display: inline-flex;
      padding: 3px;
      background: var(--sb-chip);
      border-radius: 8px;
    }
    .seg button {
      height: 26px;
      padding: 0 12px;
      border: none;
      border-radius: 6px;
      background: transparent;
      font: inherit;
      font-size: 12.5px;
      font-weight: 500;
      color: var(--sb-text-muted);
      cursor: pointer;
      transition: background .12s, color .12s;
    }
    .seg button:hover { color: var(--sb-text); }
    .seg button[data-on='1'] {
      background: var(--sb-surface);
      color: var(--sb-text);
      box-shadow: 0 1px 2px rgba(16, 24, 40, .06);
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: none; }
    }
    .menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 30;
      display: flex;
      flex-direction: column;
      max-height: 280px;
      background: var(--sb-surface);
      border: 1px solid var(--sb-border);
      border-radius: 12px;
      box-shadow: var(--sb-shadow-lg);
      overflow: hidden;
      animation: dropIn .14s ease-out;
    }
    .menu__search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--sb-border);
      color: var(--sb-text-muted);
    }
    .menu__search input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font: inherit;
      font-size: 13.5px;
      color: var(--sb-text);
    }
    .menu__list { overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 2px; }
    .menu__item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      font: inherit;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--sb-text);
      text-align: left;
      cursor: pointer;
      transition: background .12s, color .12s;
    }
    .menu__item:hover { background: var(--sb-chip); }
    .menu__item--active {
      background: var(--sb-primary-soft);
      color: var(--sb-primary);
      font-weight: 600;
    }
    .menu__item--active:hover { background: var(--sb-primary-soft); }
    .menu__item--empty { color: var(--sb-text-subtle); }
    .menu__icon { color: var(--sb-text-muted); flex-shrink: 0; }
    .menu__item--active .menu__icon { color: var(--sb-primary); }
    .menu__label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .menu__check { color: var(--sb-primary); flex-shrink: 0; }
    .menu__empty { padding: 16px; font-size: 13px; color: var(--sb-text-subtle); text-align: center; }
  `],
})
export class SearchFieldComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly field = input.required<SearchField>();
  readonly value = model<string>('');
  readonly labels = input<SearchPillLabels>(DEFAULT_LABELS);

  protected readonly focused = signal(false);
  protected readonly open = signal(false);
  protected readonly filterText = signal('');

  protected readonly isSegmented = computed(() => {
    const f = this.field();
    if (f.kind !== 'select' || !f.options) return false;
    const max = f.segmentedMax ?? 4;
    return f.options.length <= max && f.options.every((o) => !!o);
  });

  protected readonly searchable = computed(() => {
    const f = this.field();
    return (f.options?.length ?? 0) > (f.searchableFrom ?? 6);
  });

  protected readonly filteredOptions = computed(() => {
    const opts = this.field().options ?? [];
    const q = this.filterText().toLowerCase();
    return q ? opts.filter((o) => (o || '').toLowerCase().includes(q)) : opts;
  });

  protected toggleOpen(): void {
    this.open.update((v) => !v);
    if (this.open()) this.filterText.set('');
  }

  protected pick(o: string): void {
    this.value.set(o);
    this.open.set(false);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocDown(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.open.set(false);
  }
}
