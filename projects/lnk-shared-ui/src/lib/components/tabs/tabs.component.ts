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

import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { LoadingComponent } from '../loading/loading.component';

/** Definizione di un tab. */
export interface TabDef {
  /** Identificatore univoco usato per `activeId`. */
  id: string;
  /** Chiave i18n della label visibile. */
  labelKey: string;
  /** Nome icona ng-icon opzionale (es. `'bootstrapClockHistory'`). */
  icon?: string;
  /** Counter opzionale a destra del label (es. numero di item). */
  badge?: number | string | null;
  /** Mostra uno spinner inline al posto del badge (utile durante il
   *  caricamento del dato che valorizzerà il counter). */
  badgeLoading?: boolean;
  /** Disabilita il tab (non cliccabile, opacità ridotta). */
  disabled?: boolean;
}

/** Varianti grafiche disponibili per `<lnk-tabs>`. */
export type TabsVariant = 'underline' | 'segmented';

/**
 * Dimensione di `<lnk-tabs>`. `sm` rende le pillole della variante
 * `segmented` più compatte (padding/font/radius ridotti) — utile per
 * toolbar sticky strette o all'interno del `<lnk-tweaks-panel>`.
 */
export type TabsSize = 'md' | 'sm';

/**
 * Tabs riutilizzabili.
 *
 *   ```html
 *   <lnk-tabs [tabs]="tabs" [(activeId)]="active" />
 *   <lnk-tabs [tabs]="tabs" [(activeId)]="active" variant="segmented" />
 *   <lnk-tabs [tabs]="tabs" [(activeId)]="active"
 *             variant="segmented" size="sm" />
 *   @if (active() === 'dati') { ... }
 *   @if (active() === 'eventi') { ... }
 *   ```
 *
 * Due varianti:
 * - `underline` (default): barra di header con bottoni `border-b-2`
 *   sull'attivo, hover/focus colorano il testo con `--primary`.
 * - `segmented`: contenitore a pillola con sfondo `--muted`; il tab attivo
 *   ha background card con leggera ombra (segmented control iOS-like).
 *   Disponibile in due dimensioni via `size`: `'md'` (default) e `'sm'`.
 *
 * **Theming.** Tutti i colori, raggi e spaziature sono pilotati da
 * CSS variables `--lnk-tabs-*` (con fallback sui token globali del tema).
 * Per personalizzare basta sovrascriverle in `:root`, su un container
 * ancestor o inline:
 *
 *   ```css
 *   :root {
 *     --lnk-tabs-segmented-track-bg: var(--muted);
 *     --lnk-tabs-segmented-pill-bg: var(--card-bg);
 *     --lnk-tabs-indicator-color: var(--primary);
 *   }
 *   ```
 *
 * Vedi i blocchi `:host { --lnk-tabs-* }` negli stili per l'elenco
 * completo (shared / underline / segmented).
 *
 * Il contenuto è gestito dal chiamante via signal `activeId`
 * (two-way `[(activeId)]`).
 */
@Component({
  selector: 'lnk-tabs',
  standalone: true,
  imports: [TranslatePipe, NgIcon, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /*
     * Theming
     * --------
     * Tutti i valori grafici sono esposti come CSS variables con fallback
     * inline sui token di tema globali. È sufficiente sovrascriverle in
     * :root (es. via ThemeLoaderService dal theme.json) o per istanza con
     * style="--lnk-tabs-...: ..." sul tag.
     *
     * IMPORTANTE: i default NON sono dichiarati su :host per non oscurare
     * la cascade dei valori scritti su :root. Stanno come secondo argomento
     * del var() in ogni regola dove servono.
     *
     * Variabili (raggruppate per uso):
     *   shared    --lnk-tabs-text, -text-hover, -text-active,
     *             -font-size, -font-weight, -font-weight-active,
     *             -gap, -padding-x, -padding-y, -focus-ring,
     *             -badge-bg, -badge-text
     *   underline --lnk-tabs-track-border, -indicator-color,
     *             -indicator-size
     *   segmented --lnk-tabs-segmented-track-bg, -track-padding,
     *             -track-radius, -padding-x, -padding-y, -radius,
     *             -pill-bg, -pill-text, -pill-shadow,
     *             -pill-font-weight, -text-hover,
     *             -badge-bg, -badge-bg-active, -badge-text-active
     */
    :host {
      display: block;
    }

    /* Margin solo quando la barra è seguita da altro contenuto nel
       proprio container (così quando i tabs sono dentro la sticky
       toolbar, dove sono l'ultimo elemento, non aggiungono spazio extra). */
    :host:not(:last-child) {
      margin-bottom: 1rem;
    }

    /* ---------- Variante: underline (default) ---------- */
    .lnk-tablist--underline {
      display: flex;
      align-items: flex-end;
      gap: var(--lnk-tabs-gap, 0.25rem);
      border-bottom: 1px solid var(--lnk-tabs-track-border, var(--card-border));
      overflow-x: auto;
    }
    .lnk-tab--underline {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding:
        var(--lnk-tabs-padding-y, 0.5rem)
        var(--lnk-tabs-padding-x, 1rem);
      margin-bottom: -1px;
      font-size: var(--lnk-tabs-font-size, 0.875rem);
      font-weight: var(--lnk-tabs-font-weight, 500);
      white-space: nowrap;
      border-bottom:
        var(--lnk-tabs-indicator-size, 2px)
        solid transparent;
      color: var(--lnk-tabs-text, var(--muted-foreground));
      cursor: pointer;
      background: transparent;
      transition: color 0.15s, border-color 0.15s;
    }
    .lnk-tab--underline:hover:not(:disabled),
    .lnk-tab--underline:focus-visible {
      color: var(--lnk-tabs-text-hover, var(--primary));
      outline: none;
    }
    .lnk-tab--underline.is-active {
      color: var(--lnk-tabs-text-active, var(--primary));
      border-bottom-color: var(--lnk-tabs-indicator-color, var(--primary));
      font-weight: var(--lnk-tabs-font-weight-active, 500);
    }

    /* ---------- Variante: segmented ---------- */
    .lnk-tablist--segmented {
      display: inline-flex;
      align-items: center;
      gap: var(--lnk-tabs-gap, 0.25rem);
      padding: var(--lnk-tabs-segmented-track-padding, 0.25rem);
      background: var(--lnk-tabs-segmented-track-bg, var(--muted));
      border-radius: var(--lnk-tabs-segmented-track-radius, 0.625rem);
      max-width: 100%;
      overflow-x: auto;
    }
    .lnk-tab--segmented {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding:
        var(--lnk-tabs-segmented-padding-y, 0.375rem)
        var(--lnk-tabs-segmented-padding-x, 0.875rem);
      font-size: var(--lnk-tabs-font-size, 0.875rem);
      font-weight: var(--lnk-tabs-font-weight, 500);
      white-space: nowrap;
      color: var(--lnk-tabs-text, var(--muted-foreground));
      background: transparent;
      border: 0;
      border-radius: var(--lnk-tabs-segmented-radius, 0.5rem);
      cursor: pointer;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    }
    .lnk-tab--segmented:hover:not(:disabled):not(.is-active) {
      color: var(--lnk-tabs-segmented-text-hover, var(--foreground));
    }
    .lnk-tab--segmented:focus-visible {
      outline: 2px solid var(--lnk-tabs-focus-ring, var(--primary));
      outline-offset: 2px;
    }
    .lnk-tab--segmented.is-active {
      background: var(--lnk-tabs-segmented-pill-bg, var(--card-bg));
      color: var(--lnk-tabs-segmented-pill-text, var(--foreground));
      box-shadow:
        var(
          --lnk-tabs-segmented-pill-shadow,
          0 1px 2px rgb(0 0 0 / 0.06),
          0 1px 1px rgb(0 0 0 / 0.04)
        );
      font-weight: var(--lnk-tabs-segmented-pill-font-weight, 600);
    }

    /* ---------- Comuni ---------- */
    .lnk-tab {
      cursor: pointer;
    }
    .lnk-tab:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .lnk-tab__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--lnk-tabs-badge-bg, var(--muted));
      color: var(--lnk-tabs-badge-text, var(--muted-foreground));
    }
    .lnk-tab--segmented .lnk-tab__badge {
      background:
        var(
          --lnk-tabs-segmented-badge-bg,
          color-mix(in srgb, var(--muted-foreground) 18%, transparent)
        );
    }
    .lnk-tab--segmented.is-active .lnk-tab__badge {
      background: var(--lnk-tabs-segmented-badge-bg-active, var(--muted));
      color: var(--lnk-tabs-segmented-badge-text-active, var(--foreground));
    }

    /* ---------- Size: sm (segmented) ---------- */
    /* Riduce padding/font/raggi della variante segmented sovrascrivendo
       le CSS vars sul tablist; le regole figlie ereditano via cascade. */
    .lnk-tabs-size--sm.lnk-tablist--segmented {
      --lnk-tabs-font-size: 0.75rem;
      --lnk-tabs-segmented-track-padding: 0.125rem;
      --lnk-tabs-segmented-track-radius: 0.5rem;
      --lnk-tabs-segmented-padding-x: 0.5rem;
      --lnk-tabs-segmented-padding-y: 0.1875rem;
      --lnk-tabs-segmented-radius: 0.375rem;
    }
    .lnk-tabs-size--sm .lnk-tab__badge {
      min-width: 1rem;
      height: 1rem;
      padding: 0 0.25rem;
      font-size: 0.6875rem;
    }
  `,
  template: `
    <div role="tablist" [class]="tablistClass()">
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          [id]="'tab-' + tab.id"
          [attr.aria-selected]="activeId() === tab.id"
          [attr.aria-controls]="'tabpanel-' + tab.id"
          [attr.tabindex]="activeId() === tab.id ? 0 : -1"
          [disabled]="tab.disabled || null"
          [class]="'lnk-tab lnk-tab--' + variant()"
          [class.is-active]="activeId() === tab.id"
          (click)="!tab.disabled && activeId.set(tab.id)"
        >
          @if (tab.icon) {
            <ng-icon [name]="tab.icon" size="1rem" />
          }
          <span>{{ tab.labelKey | translate }}</span>
          @if (tab.badgeLoading) {
            <lnk-loading [inline]="true" size="sm" [labelKey]="null" />
          } @else if (tab.badge != null && tab.badge !== '') {
            <span class="lnk-tab__badge">{{ tab.badge }}</span>
          }
        </button>
      }
    </div>
  `,
})
export class TabsComponent {
  readonly tabs = input.required<TabDef[]>();
  /** Tab corrente. Two-way binding con il chiamante. */
  readonly activeId = model.required<string>();
  /** Variante grafica: `underline` (default) o `segmented` (pill). */
  readonly variant = input<TabsVariant>('underline');
  /** Dimensione: `md` (default) o `sm` (compatto). Effetto visibile sulla variante `segmented`. */
  readonly size = input<TabsSize>('md');

  protected readonly tablistClass = computed(
    () => `lnk-tablist--${this.variant()} lnk-tabs-size--${this.size()}`
  );
}
