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
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Opzione del dropdown: valore, label i18n e colore di riferimento opzionale. */
export interface TweakSelectOption {
  value: string;
  labelKey: string;
  /** Colore mostrato come pallino accanto alla label. */
  color?: string;
}

/**
 * Dropdown custom (non `<select>` nativo) bound a una scelta enum-like. Ogni
 * voce mostra un pallino col colore di riferimento. Adatto a molte opzioni
 * (es. selettore tema). Stile e comportamento allineati al menu profilo.
 *
 *   ```html
 *   <lnk-tweak-select [options]="themeOptions()" [value]="active()"
 *     (valueChange)="onChange($event)" />
 *   ```
 */
@Component({
  selector: 'lnk-tweak-select',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; position: relative; }
    .sel__trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-width: 9rem;
      padding: 0.375rem 0.625rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background: var(--card-bg);
      color: var(--foreground);
      font: inherit;
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .sel__trigger:focus { outline: none; box-shadow: 0 0 0 2px var(--ring); }
    .sel__dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 9999px;
      flex-shrink: 0;
      box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
    }
    .sel__label { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sel__chev { color: var(--muted-foreground); flex-shrink: 0; transition: transform 0.15s; }
    :host(.open) .sel__chev, .sel--open .sel__chev { transform: rotate(180deg); }
    .sel__menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 50;
      max-height: 16rem;
      overflow-y: auto;
      padding: 0.25rem;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      box-shadow: 0 10px 30px rgb(0 0 0 / 0.14);
    }
    .sel__item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 0.375rem 0.5rem;
      border: none;
      border-radius: 0.375rem;
      background: transparent;
      color: var(--foreground);
      font: inherit;
      font-size: 0.8125rem;
      text-align: left;
      cursor: pointer;
    }
    .sel__item:hover { background: var(--muted); }
    .sel__item--active { color: var(--primary); font-weight: 600; }
    .sel__check { color: var(--primary); flex-shrink: 0; }
  `,
  template: `
    <button
      type="button"
      class="sel__trigger"
      [class.sel--open]="open()"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
      (click)="toggle()"
    >
      <span class="sel__dot" [style.background]="currentColor() || 'transparent'"></span>
      <span class="sel__label">{{ currentLabel() | translate }}</span>
      <ng-icon name="bootstrapChevronDown" size="0.9rem" class="sel__chev" />
    </button>

    @if (open()) {
      <div class="sel__menu" role="listbox">
        @for (o of options(); track o.value) {
          <button
            type="button"
            class="sel__item"
            [class.sel__item--active]="o.value === value()"
            role="option"
            [attr.aria-selected]="o.value === value()"
            (click)="pick(o.value)"
          >
            <span class="sel__dot" [style.background]="o.color || 'transparent'"></span>
            <span class="sel__label">{{ o.labelKey | translate }}</span>
            @if (o.value === value()) {
              <ng-icon name="bootstrapCheck2" size="0.9rem" class="sel__check" />
            }
          </button>
        }
      </div>
    }
  `,
})
export class TweakSelectComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input.required<TweakSelectOption[]>();
  readonly value = model.required<string>();

  protected readonly open = signal(false);

  private readonly current = computed(() => this.options().find((o) => o.value === this.value()));
  protected readonly currentColor = computed(() => this.current()?.color ?? null);
  protected readonly currentLabel = computed(() => this.current()?.labelKey ?? '');

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected pick(value: string): void {
    this.value.set(value);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.open.set(false);
  }
}
