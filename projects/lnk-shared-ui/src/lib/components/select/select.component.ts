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
  ElementRef,
  HostListener,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Opzione del dropdown `lnk-select`. */
export interface LnkSelectOption {
  value: string;
  label: string;
  /** Testo secondario sotto la label. */
  description?: string;
  /** Icona (nome ng-icon) mostrata a sinistra. */
  icon?: string;
  /** Opzione non selezionabile. */
  disabled?: boolean;
  /** Etichetta del gruppo di appartenenza (per il raggruppamento). */
  group?: string;
}

interface OptionGroup {
  key: string;
  label?: string;
  options: LnkSelectOption[];
}

/**
 * Dropdown personalizzato (sostituisce `<select>`) con la UI del menu profilo:
 * trigger + pannello flottante `position: fixed` (esce dai contenitori con
 * `overflow: hidden`), chiusura su click-fuori / `Escape` / scroll, navigazione
 * da tastiera, apertura verso l'alto se in fondo non c'è spazio.
 *
 * Funzioni: **ricerca/filtro** (`searchable`), **selezione multipla**
 * (`multiple`, valore = `string[]`), **opzioni ricche** (descrizione, icona,
 * disabilitate) e **gruppi** (`group`).
 *
 * È un `ControlValueAccessor`: valore = `value` dell'opzione (stringa vuota =
 * nessuna) in single, oppure `string[]` in multiple.
 *
 * ```html
 * <lnk-select [formControl]="tipo" [options]="opts" [placeholder]="'…' | translate" />
 * <lnk-select [formControl]="tags" [options]="opts" multiple searchable />
 * ```
 */
@Component({
  selector: 'lnk-select',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <button
      #trigger
      type="button"
      class="lnk-select-trigger"
      [disabled]="disabled()"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-label]="ariaLabel() || null"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span class="truncate" [class.lnk-select-ph]="!hasSelection()">{{ triggerText() }}</span>
      <ng-icon name="bootstrapChevronDown" size="1rem" class="opacity-60 shrink-0" />
    </button>

    @if (isOpen()) {
      <div
        #panel
        class="lnk-select-panel"
        role="listbox"
        [attr.aria-multiselectable]="multiple() || null"
        tabindex="-1"
        [style.left.px]="left()"
        [style.top.px]="dropUp() ? null : top()"
        [style.bottom.px]="dropUp() ? bottomPos() : null"
        [style.min-width.px]="width()"
        [style.max-height.px]="maxH()"
        (keydown)="onPanelKeydown($event)"
      >
        @if (searchable()) {
          <div class="lnk-select-search">
            <ng-icon name="bootstrapSearch" size="0.9rem" class="opacity-60 shrink-0" />
            <input
              #search
              type="text"
              [value]="query()"
              [attr.placeholder]="searchPlaceholder() || (placeholder() || '')"
              (input)="query.set($any($event.target).value)"
              (keydown)="onSearchKeydown($event)"
            />
          </div>
        }

        @if (allowEmpty() && !multiple()) {
          <button
            type="button"
            role="option"
            class="lnk-select-opt"
            [class.is-active]="!hasSelection()"
            [attr.aria-selected]="!hasSelection()"
            (click)="pick('')"
          >
            <span class="flex-1 min-w-0 truncate lnk-select-ph">{{ placeholder() }}</span>
            @if (!hasSelection()) { <ng-icon name="bootstrapCheck2" size="1rem" class="shrink-0" /> }
          </button>
        }

        @for (g of groups(); track g.key) {
          @if (g.label) { <div class="lnk-select-group">{{ g.label }}</div> }
          @for (o of g.options; track o.value) {
            <button
              type="button"
              role="option"
              class="lnk-select-opt"
              [disabled]="o.disabled"
              [class.is-active]="isSelected(o.value)"
              [attr.aria-selected]="isSelected(o.value)"
              (click)="choose(o)"
            >
              @if (multiple()) {
                <span class="lnk-select-check" [class.is-on]="isSelected(o.value)">
                  @if (isSelected(o.value)) { <ng-icon name="bootstrapCheck2" size="0.85rem" /> }
                </span>
              }
              @if (o.icon) { <ng-icon [name]="o.icon" size="1rem" class="shrink-0 opacity-80" /> }
              <span class="flex-1 min-w-0">
                <span class="block truncate">{{ o.label }}</span>
                @if (o.description) { <span class="block truncate text-xs text-[var(--muted-foreground)]">{{ o.description }}</span> }
              </span>
              @if (!multiple() && isSelected(o.value)) { <ng-icon name="bootstrapCheck2" size="1rem" class="shrink-0" /> }
            </button>
          }
        }

        @if (!groups().length) {
          <div class="lnk-select-empty">{{ 'Common.NoResults' | translate }}</div>
        }
      </div>
    }
  `,
  styles: `
    .lnk-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      box-sizing: border-box;
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      background: var(--card-bg);
      color: var(--foreground);
      font-size: 0.875rem;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }
    .lnk-select-trigger:hover:not(:disabled) {
      border-color: var(--ring);
    }
    .lnk-select-trigger:focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 1px;
    }
    .lnk-select-trigger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .lnk-select-ph {
      color: var(--muted-foreground);
    }
    .lnk-select-panel {
      position: fixed;
      z-index: 50;
      padding: 0.25rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background: var(--card-bg);
      box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.35);
      overflow-y: auto;
      max-width: min(90vw, 28rem);
    }
    :host-context(.dark) .lnk-select-panel {
      box-shadow: 0 10px 30px -8px rgba(0, 0, 0, 0.7);
    }
    .lnk-select-opt {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 0;
      border-radius: 0.375rem;
      background: transparent;
      color: var(--foreground);
      font-size: 0.875rem;
      text-align: left;
      cursor: pointer;
    }
    .lnk-select-opt:hover:not(:disabled),
    .lnk-select-opt:focus-visible {
      background: var(--muted);
      outline: none;
    }
    .lnk-select-opt.is-active {
      color: var(--primary);
      font-weight: 600;
    }
    .lnk-select-opt:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .lnk-select-search {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.625rem;
      margin-bottom: 0.25rem;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border);
    }
    .lnk-select-search input {
      flex: 1;
      min-width: 0;
      border: 0;
      background: transparent;
      outline: none;
      font: inherit;
      font-size: 0.875rem;
      color: var(--foreground);
    }
    .lnk-select-group {
      padding: 0.375rem 0.75rem 0.25rem;
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      color: var(--muted-foreground);
    }
    .lnk-select-empty {
      padding: 0.75rem;
      font-size: 0.8125rem;
      text-align: center;
      color: var(--muted-foreground);
    }
    .lnk-select-check {
      flex: none;
      width: 1rem;
      height: 1rem;
      display: grid;
      place-items: center;
      border: 1px solid var(--border);
      border-radius: 0.25rem;
      color: var(--primary);
    }
    .lnk-select-check.is-on {
      border-color: var(--primary);
      background: color-mix(in srgb, var(--primary) 15%, transparent);
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
})
export class SelectComponent implements ControlValueAccessor {
  /** Opzioni: oggetti `LnkSelectOption` oppure semplici stringhe (value=label). */
  readonly options = input<Array<LnkSelectOption | string>>([]);
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  /** Mostra l'opzione "vuota" (clear) in cima. Solo single. */
  readonly allowEmpty = input(true, { transform: booleanAttribute });
  /** Selezione multipla: il valore del control diventa `string[]`. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Mostra un campo di ricerca nel pannello. */
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchPlaceholder = input('');

  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  /** Valori selezionati (uno solo in single mode). */
  protected readonly selected = signal<string[]>([]);
  protected readonly disabled = signal(false);
  protected readonly isOpen = signal(false);
  protected readonly query = signal('');
  protected readonly left = signal(0);
  protected readonly top = signal(0);
  protected readonly bottomPos = signal(0);
  protected readonly width = signal(0);
  protected readonly maxH = signal(320);
  protected readonly dropUp = signal(false);

  /** Opzioni normalizzate (stringa → `{value,label}`). */
  protected readonly normOptions = computed<LnkSelectOption[]>(() =>
    this.options().map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  );

  /** Opzioni filtrate dalla ricerca. */
  private readonly filtered = computed<LnkSelectOption[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!this.searchable() || !q) return this.normOptions();
    return this.normOptions().filter(
      (o) => o.label.toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q)
    );
  });

  /** Opzioni raggruppate (un gruppo senza label se non c'è `group`). */
  protected readonly groups = computed<OptionGroup[]>(() => {
    const out: OptionGroup[] = [];
    const byKey = new Map<string, OptionGroup>();
    for (const o of this.filtered()) {
      const key = o.group ?? '';
      let g = byKey.get(key);
      if (!g) {
        g = { key, label: o.group, options: [] };
        byKey.set(key, g);
        out.push(g);
      }
      g.options.push(o);
    }
    return out;
  });

  protected readonly hasSelection = computed(() => this.selected().length > 0);

  protected readonly triggerText = computed(() => {
    const labels = this.normOptions()
      .filter((o) => this.selected().includes(o.value))
      .map((o) => o.label);
    return labels.length ? labels.join(', ') : this.placeholder();
  });

  private onChange: (v: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: unknown): void {
    if (this.multiple()) {
      this.selected.set(Array.isArray(v) ? v.map(String) : []);
    } else {
      this.selected.set(v == null || v === '' ? [] : [String(v)]);
    }
  }
  registerOnChange(fn: (v: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
    if (d) this.close();
  }

  protected isSelected(v: string): boolean {
    return this.selected().includes(v);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
      return;
    }
    const r = this.triggerRef().nativeElement.getBoundingClientRect();
    const PANEL_MAX = 320;
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    // Apre verso l'alto se sotto non c'è spazio a sufficienza e sopra ce n'è di più.
    const up = spaceBelow < Math.min(PANEL_MAX, 240) && spaceAbove > spaceBelow;
    this.dropUp.set(up);
    this.left.set(r.left);
    // Il pannello non è più stretto del trigger, ma ha un minimo leggibile.
    this.width.set(Math.max(r.width, 240));
    if (up) {
      this.bottomPos.set(window.innerHeight - r.top + 4);
      this.maxH.set(Math.min(PANEL_MAX, spaceAbove));
    } else {
      this.top.set(r.bottom + 4);
      this.maxH.set(Math.min(PANEL_MAX, spaceBelow));
    }
    this.isOpen.set(true);
    setTimeout(() => {
      const s = this.searchRef()?.nativeElement;
      if (s) {
        s.focus();
        return;
      }
      const p = this.panelRef()?.nativeElement;
      const target = p?.querySelector<HTMLElement>('.is-active') ?? p?.querySelector<HTMLElement>('.lnk-select-opt') ?? p;
      target?.focus();
    });
  }

  private close(): void {
    this.isOpen.set(false);
    this.query.set('');
  }

  /** Click su un'opzione: single seleziona e chiude, multiple commuta. */
  protected choose(o: LnkSelectOption): void {
    if (o.disabled) return;
    if (this.multiple()) {
      this.selected.update((arr) => (arr.includes(o.value) ? arr.filter((x) => x !== o.value) : [...arr, o.value]));
      this.onChange(this.selected());
      this.onTouched();
    } else {
      this.pick(o.value);
    }
  }

  protected pick(v: string): void {
    this.selected.set(v === '' ? [] : [v]);
    this.onChange(v);
    this.onTouched();
    this.close();
    this.triggerRef().nativeElement.focus();
  }

  protected onTriggerKeydown(e: KeyboardEvent): void {
    if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !this.isOpen()) {
      e.preventDefault();
      this.toggle();
    }
  }

  protected onSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.firstOption()?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      this.triggerRef().nativeElement.focus();
    }
  }

  protected onPanelKeydown(e: KeyboardEvent): void {
    const opts = this.optionEls();
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (i < 0) this.firstOption()?.focus();
        else opts[Math.min(opts.length - 1, i + 1)]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (i <= 0) this.searchRef()?.nativeElement.focus();
        else opts[i - 1]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        this.firstOption()?.focus();
        break;
      case 'End':
        e.preventDefault();
        opts[opts.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        this.triggerRef().nativeElement.focus();
        break;
    }
  }

  private optionEls(): HTMLButtonElement[] {
    return Array.from(this.panelRef()?.nativeElement.querySelectorAll<HTMLButtonElement>('.lnk-select-opt:not(:disabled)') ?? []);
  }
  private firstOption(): HTMLButtonElement | undefined {
    return this.optionEls()[0];
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (!this.isOpen()) return;
    if (target instanceof Node && !this.host.nativeElement.contains(target)) this.close();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    if (this.isOpen()) this.close();
  }
}
