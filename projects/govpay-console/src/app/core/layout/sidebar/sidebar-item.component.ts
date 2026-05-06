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
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { NavItem } from '../nav';

/**
 * Voce di sidebar con tre comportamenti:
 *   - **leaf** (no children): link cliccabile.
 *   - **accordion** (children + sidebar espansa): toggle che mostra/nasconde i figli.
 *   - **flyout** (children + sidebar collassata): popup laterale con position:fixed.
 *     Usiamo fixed (non absolute) per uscire dall'`overflow-y-auto` della nav.
 */
@Component({
  selector: 'lnk-sidebar-item',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIcon, TranslatePipe, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar-item.component.html',
})
export class SidebarItemComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly item = input.required<NavItem>();
  readonly collapsed = input<boolean>(false);
  /** True solo per i figli renderizzati nell'accordion espanso (rientro). */
  readonly nested = input<boolean>(false);

  readonly expanded = signal<boolean>(false);
  readonly flyoutOpen = signal<boolean>(false);
  readonly flyoutTop = signal<number>(0);
  readonly flyoutLeft = signal<number>(0);

  /** Ritardo prima di chiudere il flyout: dà tempo al mouse di
   *  attraversare il gap tra il trigger e il pannello senza far
   *  partire il `mouseleave` definitivo. */
  private static readonly CLOSE_DELAY_MS = 200;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  readonly hasChildren = computed(() => (this.item().children?.length ?? 0) > 0);

  /**
   * URL corrente come signal — `router.isActive` non è reattivo, quindi
   * dobbiamo costruire una sorgente reattiva per i `computed` che vogliono
   * sapere se la rotta è cambiata.
   */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Vero se la rotta corrente coincide con questa voce (leaf) o con uno dei suoi figli. */
  readonly hasActiveChild = computed(() => {
    const url = this.currentUrl();
    const matches = (route?: string): boolean => {
      if (!route) return false;
      // `subset`: la rotta del menu è un prefisso della rotta corrente.
      return url === route || url.startsWith(route + '/') || url.startsWith(route + '?');
    };
    const walk = (items: NavItem[]): boolean => {
      for (const c of items) {
        if (matches(c.route)) return true;
        if (c.children?.length && walk(c.children)) return true;
      }
      return false;
    };
    const children = this.item().children;
    return children?.length ? walk(children) : false;
  });

  ngOnInit(): void {
    if (this.hasActiveChild()) this.expanded.set(true);
  }

  // Auto-espande il padre quando un figlio diventa attivo a runtime
  // (es. dopo navigazione, non solo all'init).
  private readonly _autoExpand = effect(() => {
    if (this.hasActiveChild() && !this.collapsed()) {
      this.expanded.set(true);
    }
  });

  toggle(event: Event): void {
    event.preventDefault();
    if (this.collapsed() && this.hasChildren()) {
      // Quando collassata il click apre il flyout, non l'accordion
      this.openFlyout(event.currentTarget as HTMLElement);
      return;
    }
    this.expanded.update((v) => !v);
  }

  onMouseEnter(event: MouseEvent): void {
    this.cancelClose();
    if (this.collapsed() && this.hasChildren()) {
      this.openFlyout(event.currentTarget as HTMLElement);
    }
  }

  onMouseLeave(): void {
    if (this.collapsed()) this.scheduleClose();
  }

  /** Mouse sopra il pannello flyout: tieni aperto. */
  onFlyoutEnter(): void {
    this.cancelClose();
  }

  /** Mouse fuori dal pannello flyout: chiudi con ritardo
   *  (così se rientra sul trigger non si chiude). */
  onFlyoutLeave(): void {
    this.scheduleClose();
  }

  private openFlyout(trigger: HTMLElement | null): void {
    if (!trigger) return;
    const btn = trigger.querySelector('button') ?? trigger;
    const rect = (btn as HTMLElement).getBoundingClientRect();
    this.flyoutTop.set(rect.top);
    // Gap visivo di 6px tra trigger e pannello. Il `<span>` "bridge"
    // dentro al pannello (vedi template) copre lo stesso 6px lato hit
    // area, così il cursore può attraversarlo senza perdere l'hover.
    this.flyoutLeft.set(rect.right + 6);
    this.flyoutOpen.set(true);
  }

  private scheduleClose(): void {
    this.cancelClose();
    this.closeTimer = setTimeout(
      () => this.flyoutOpen.set(false),
      SidebarItemComponent.CLOSE_DELAY_MS,
    );
  }

  private cancelClose(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.cancelClose();
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (!this.flyoutOpen()) return;
    const el = this.host.nativeElement as HTMLElement;
    if (target instanceof Node && !el.contains(target)) this.flyoutOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.flyoutOpen()) this.flyoutOpen.set(false);
  }
}
