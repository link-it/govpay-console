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

import { Directive } from '@angular/core';

/**
 * Disabilita l'autocompletamento e il menu di suggerimenti del browser / dei
 * password-manager sui campi segreti che NON sono credenziali di login
 * (subscription key, API key, client secret, password keystore/truststore…).
 *
 * `autocomplete="new-password"` non basta: Chrome smette di offrire le password
 * salvate ma continua a mostrare al focus il menu "Suggerisci password sicura".
 * Usiamo quindi:
 *  - `autocomplete="one-time-code"`: Chrome lo tratta come campo OTP e non
 *    aggancia il password manager, quindi niente menu a tendina al focus;
 *  - hint proprietari per disattivare 1Password / LastPass / Bitwarden;
 *  - il trick `readonly` finché il campo non riceve il focus, che impedisce il
 *    precompilamento al load su tutti i browser.
 */
@Directive({
  selector: 'input[lnkNoAutofill]',
  standalone: true,
  host: {
    autocomplete: 'one-time-code',
    readonly: 'true',
    'data-1p-ignore': 'true',
    'data-lpignore': 'true',
    'data-bwignore': 'true',
    'data-form-type': 'other',
    '(focus)': 'onFocus($event)',
  },
})
export class NoAutofillDirective {
  onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).removeAttribute('readonly');
  }
}
