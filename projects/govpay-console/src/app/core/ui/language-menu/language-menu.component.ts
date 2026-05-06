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
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatTooltipModule, type TooltipPosition } from '@angular/material/tooltip';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '@core/i18n';

/**
 * Selettore lingua. Pulsante con icona globe (e sigla breve / bandiera) che
 * apre un popup con la lista delle lingue disponibili.
 *
 * Posizionamento popup:
 *   - quando il componente è nell'header → dropdown verso il basso (`top-full`)
 *   - quando è nella sidebar → dropup (`bottom-full`) per non andare fuori schermo
 *
 * La direzione è determinata automaticamente dalla posizione del bottone:
 * se il bottone è nella metà inferiore della viewport, apriamo verso l'alto.
 */
@Component({
  selector: 'lnk-language-menu',
  standalone: true,
  imports: [NgIcon, TranslatePipe, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-menu.component.html',
})
export class LanguageMenuComponent {
  private readonly i18n = inject(LanguageService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly languages = this.i18n.languages;
  readonly current = this.i18n.currentLanguage;

  /** Posizione del tooltip Material. Default: `below` (header). Sidebar: `right`. */
  readonly tooltipPosition = input<TooltipPosition>('below');
  /** Sidebar collassata: il pannello esce a destra come flyout fisso
   *  (modello `<lnk-sidebar-item>`) per non essere troncato dalla
   *  larghezza ridotta del contenitore. */
  readonly collapsed = input<boolean>(false);

  readonly isOpen = signal(false);
  readonly openUp = signal(false);
  readonly flyoutLeft = signal(0);
  readonly flyoutBottom = signal(0);

  readonly currentShort = computed(() => {
    const c = this.current();
    return c?.short ?? c?.code.toUpperCase() ?? '';
  });

  toggle(event: Event): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      return;
    }
    const trigger = event.currentTarget as HTMLElement | null;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      if (this.collapsed()) {
        // Flyout: pannello fissato a destra del trigger, ancorato al
        // bordo inferiore (cresce verso l'alto come il profile menu,
        // perché il pulsante è nel footer della sidebar).
        this.flyoutLeft.set(rect.right + 6);
        this.flyoutBottom.set(window.innerHeight - rect.bottom);
      } else {
        // se il pulsante sta nella metà inferiore della viewport apri verso l'alto
        this.openUp.set(rect.top > window.innerHeight / 2);
      }
    }
    this.isOpen.set(true);
  }

  select(code: string): void {
    this.i18n.setLanguage(code);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (!this.isOpen()) return;
    const el = this.host.nativeElement as HTMLElement;
    if (target instanceof Node && !el.contains(target)) this.isOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.isOpen.set(false);
  }
}
