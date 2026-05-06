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

/**
 * Switch boolean per `<lnk-tweaks-panel>`. Two-way su `value`.
 *
 *   ```html
 *   <lnk-tweak-toggle [(value)]="showHelp" />
 *   ```
 */
@Component({
  selector: 'lnk-tweak-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-block;
    }
    .lnk-toggle {
      position: relative;
      display: inline-flex;
      width: 2.25rem;
      height: 1.25rem;
      flex-shrink: 0;
      border-radius: 9999px;
      background: var(--muted);
      border: 1px solid var(--card-border);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .lnk-toggle:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
    .lnk-toggle:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .lnk-toggle__thumb {
      position: absolute;
      top: 1px;
      left: 1px;
      width: 1rem;
      height: 1rem;
      border-radius: 9999px;
      background: var(--card-bg);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
      transition: transform 0.15s;
    }
    .lnk-toggle.is-on {
      background: var(--primary);
      border-color: var(--primary);
    }
    .lnk-toggle.is-on .lnk-toggle__thumb {
      transform: translateX(1rem);
    }
  `,
  template: `
    <button
      type="button"
      role="switch"
      class="lnk-toggle"
      [class.is-on]="value()"
      [attr.aria-checked]="value()"
      [disabled]="disabled() || null"
      (click)="onToggle()"
    >
      <span class="lnk-toggle__thumb" aria-hidden="true"></span>
    </button>
  `,
})
export class TweakToggleComponent {
  readonly value = model<boolean>(false);
  readonly disabled = input<boolean>(false);

  onToggle(): void {
    if (this.disabled()) return;
    this.value.update((v) => !v);
  }
}
