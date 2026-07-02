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

import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';

/**
 * Marca il label di un campo come obbligatorio (classe `.lnk-required` →
 * asterisco danger) quando il `FormControl` associato ha `Validators.required`.
 *
 * L'obbligatorietà resta così definita in un solo posto (i validator del form)
 * e il marcatore si aggiorna di conseguenza, senza classi da mantenere a mano.
 *
 * ```html
 * <span class="..." [lnkRequiredLabel]="form.controls.idStazione">Id</span>
 * ```
 */
@Directive({
  selector: '[lnkRequiredLabel]',
  standalone: true,
})
export class RequiredLabelDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  /** Control (o gruppo) di cui riflettere l'obbligatorietà. */
  readonly control = input.required<AbstractControl | null | undefined>({ alias: 'lnkRequiredLabel' });

  constructor() {
    effect(() => {
      const c = this.control();
      const required = !!c && c.hasValidator(Validators.required);
      const method = required ? 'addClass' : 'removeClass';
      this.renderer[method](this.el.nativeElement, 'lnk-required');
    });
  }
}
