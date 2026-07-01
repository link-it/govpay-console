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

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Banner "ci sono N nuovi elementi" da mostrare in cima a una lista.
 *
 * Componente presentazionale puro: il consumer decide quando ci sono
 * nuovi dati (polling, push, ecc.) e passa `count`. Il banner si
 * mostra/nasconde automaticamente in base a `count > 0`; al click
 * emette `refresh` — il consumer deve poi ricaricare e azzerare il
 * count.
 *
 * Pair tipico con la factory `createNewDataPoller()` di
 * `@linkit/shared-ui` (`core/system/`) che gestisce il polling
 * timer-based; il poller resta opzionale.
 *
 *   ```ts
 *   readonly newItemsCount = signal(0);
 *
 *   onNewItemsRefresh(): void {
 *     this.refresh();             // ricarica
 *     this.newItemsCount.set(0);  // nasconde banner
 *   }
 *   ```
 *
 *   ```html
 *   <lnk-list-refresh-banner
 *     [count]="newItemsCount()"
 *     (refresh)="onNewItemsRefresh()"
 *   />
 *   ```
 */
@Component({
  selector: 'lnk-list-refresh-banner',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: contents;
    }
    .lnk-refresh-banner {
      display: flex;
      justify-content: center;
      padding: 0.25rem 0;
      animation: lnk-refresh-banner-pop 0.18s ease-out;
    }
    /* Shape 'button': il container delega allo slot del genitore (es. azioni
       di page-header), niente padding o animation. Il bottone riusa le
       classi utility .btn della lib. */
    .lnk-refresh-banner--button {
      display: contents;
      padding: 0;
      animation: none;
    }
    .lnk-refresh-banner--sticky {
      position: sticky;
      top: calc(var(--header-height, 4rem) + var(--lnk-list-toolbar-h, 0px) + 0.25rem);
      z-index: 20;
    }
    .lnk-refresh-banner--floating {
      position: fixed;
      top: calc(var(--header-height, 4rem) + var(--lnk-list-toolbar-h, 0px) + 0.5rem);
      left: var(--lnk-content-left, 0px);
      right: 0;
      display: flex;
      justify-content: center;
      padding: 0;
      z-index: 30;
      pointer-events: none;
      animation: lnk-refresh-banner-pop 0.18s ease-out;
    }
    .lnk-refresh-banner--floating .lnk-refresh-banner__btn {
      pointer-events: auto;
    }
    .lnk-refresh-banner__btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 9999px;
      border: 0;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
      transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
    }
    .lnk-refresh-banner__btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgb(0 0 0 / 0.20);
      filter: brightness(1.05);
    }
    .lnk-refresh-banner__btn:focus-visible {
      outline: 2px solid var(--lnk-refresh-banner-bg, var(--primary));
      outline-offset: 3px;
    }
    /* Sizes */
    .lnk-refresh-banner__btn--sm { padding: 0.35rem 0.75rem; font-size: 0.8125rem; gap: 0.375rem; }
    .lnk-refresh-banner__btn--md { padding: 0.5rem 1rem;    font-size: 0.875rem; }
    .lnk-refresh-banner__btn--lg { padding: 0.625rem 1.25rem; font-size: 1rem;   gap: 0.625rem; }
    /* Colors — fallback finale = primary, override via --lnk-refresh-banner-{bg,text} */
    .lnk-refresh-banner__btn--primary {
      background: var(--lnk-refresh-banner-bg, var(--primary));
      color:      var(--lnk-refresh-banner-text, var(--primary-foreground, #fff));
    }
    .lnk-refresh-banner__btn--secondary {
      background: var(--lnk-refresh-banner-bg, var(--lnk-btn-secondary-bg, #ffffff));
      color:      var(--lnk-refresh-banner-text, var(--lnk-btn-secondary-text, #213349));
      border: 1px solid var(--lnk-refresh-banner-border, var(--lnk-btn-secondary-border, #cce3ed));
    }
    .lnk-refresh-banner__btn--custom {
      background: var(--lnk-refresh-banner-bg, var(--primary));
      color:      var(--lnk-refresh-banner-text, var(--primary-foreground, #fff));
    }
    @keyframes lnk-refresh-banner-pop {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,
  template: `
    @if (visible()) {
      <div [class]="containerClass()" role="status" aria-live="polite">
        <button
          type="button"
          [class]="buttonClass()"
          (click)="onClick()"
          [attr.aria-label]="effectiveMessageKey() | translate: { count: count() ?? 0 }"
        >
          <ng-icon [name]="iconName()" size="1rem" />
          <span>{{ effectiveMessageKey() | translate: { count: count() ?? 0 } }}</span>
        </button>
      </div>
    }
  `,
})
export class ListRefreshBannerComponent {
  /** Numero di nuovi elementi rilevati. > 0 → banner visibile. */
  readonly count = input<number | null | undefined>(0);

  /**
   * Override esplicito della visibilita`: utile per scenari push
   * (SSE/WebSocket) che notificano "qualcosa e` cambiato" senza
   * un count. Quando `show=true` il banner appare anche con
   * `count=null` usando `genericMessageKey`.
   */
  readonly show = input<boolean | null | undefined>(null);

  /**
   * Chiave i18n del messaggio quando `count > 0`. Riceve `{{ count }}`
   * come parametro. Default `'Common.NewItems'`.
   */
  readonly messageKey = input<string>('Common.NewItems');

  /**
   * Chiave i18n alternativa quando il banner appare via `show=true`
   * senza un `count` valorizzato. Default `'Common.NewData'`.
   */
  readonly genericMessageKey = input<string>('Common.NewData');

  /** Nome icona ng-icon. Default `'bootstrapArrowClockwise'`. */
  readonly iconName = input<string>('bootstrapArrowClockwise');

  /**
   * - `'floating'` (default): pillola `position: fixed` centrata sotto
   *   l'header (`--header-height + --lnk-list-toolbar-h`), fuori dal
   *   flow del padre. Stile Twitter "new tweets" pill.
   * - `'sticky'`: `position: sticky` nel flow, resta visibile durante
   *   lo scroll della lista.
   * - `'inline'`: renderizzato nel flow del padre, scrolla con i dati.
   */
  readonly placement = input<'inline' | 'sticky' | 'floating'>('floating');

  /** Dimensione del pulsante. Default `'md'`. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Forma del pulsante:
   * - `'pill'` (default): pillola arrotondata con shadow + pop-in,
   *   stile Twitter "new tweets".
   * - `'button'`: pulsante standard con classi utility `.btn` della
   *   lib (es. quando il banner e` slot azione di un page-header e
   *   serve coerenza visiva con gli altri bottoni). Niente shadow,
   *   niente animation. La size mappa su `.btn-sm`/default. Il color
   *   mappa su `.btn-primary`/`.btn-secondary` (custom → primary +
   *   override possibile via `--lnk-btn-primary-*`).
   */
  readonly shape = input<'pill' | 'button'>('pill');

  /**
   * Variante colore del pulsante:
   * - `'primary'` (default): `var(--primary)` + foreground bianco.
   * - `'secondary'`: stile pulsante secondary della lib (bordato).
   * - `'custom'`: il consumer fornisce `--lnk-refresh-banner-bg` e
   *   `--lnk-refresh-banner-text` (es. via `[style]` binding).
   */
  readonly color = input<'primary' | 'secondary' | 'custom'>('primary');

  /**
   * Emesso al click del banner. Il consumer deve ricaricare i dati
   * e azzerare `count` (il banner non lo fa internamente).
   */
  readonly refresh = output<void>();

  /** Visibile se `show` esplicito true OR `count > 0`. */
  readonly visible = computed<boolean>(() => {
    const explicit = this.show();
    if (typeof explicit === 'boolean') return explicit;
    return (this.count() ?? 0) > 0;
  });

  /** i18n key effettiva: `messageKey` se count valorizzato, altrimenti `genericMessageKey`. */
  protected readonly effectiveMessageKey = computed<string>(() => {
    const c = this.count();
    return typeof c === 'number' && c > 0 ? this.messageKey() : this.genericMessageKey();
  });

  protected readonly containerClass = computed(() => {
    const base = 'lnk-refresh-banner';
    const classes = [base];
    if (this.placement() !== 'inline') classes.push(`${base}--${this.placement()}`);
    if (this.shape() === 'button') classes.push(`${base}--button`);
    return classes.join(' ');
  });

  protected readonly buttonClass = computed(() => {
    const base = 'lnk-refresh-banner__btn';
    if (this.shape() === 'button') {
      // Delega completamente lo stile a `.btn` della lib: niente classe
      // base (sovrascriverebbe border-radius/shadow/padding delle .btn).
      // `custom` mappa su .btn-primary (consumer override via
      // --lnk-btn-primary-*).
      const color = this.color();
      const btnColor = color === 'secondary' ? 'btn-secondary' : 'btn-primary';
      const btnSize = this.size() === 'sm' ? ' btn-sm' : '';
      return `btn ${btnColor}${btnSize}`;
    }
    return `${base} ${base}--${this.size()} ${base}--${this.color()}`;
  });

  protected onClick(): void {
    this.refresh.emit();
  }
}
