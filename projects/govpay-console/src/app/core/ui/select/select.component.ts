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
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

/** Opzione del dropdown. */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Dropdown personalizzato (sostituisce `<select>`) con la stessa UI del menu
 * profilo della sidebar: trigger + pannello flottante `position: fixed`
 * (esce dai contenitori con `overflow: hidden`), chiusura su click-fuori,
 * `Escape` e scroll, navigazione da tastiera.
 *
 * È un `ControlValueAccessor`: il valore è la `value` dell'opzione scelta
 * (stringa vuota = nessuna).
 *
 * ```html
 * <lnk-select [formControl]="tipo" [options]="opts" [placeholder]="'…Nessuno' | translate" />
 * ```
 */
@Component({
  selector: 'lnk-select',
  standalone: true,
  imports: [NgIcon],
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
      <span class="truncate" [class.lnk-select-ph]="!currentLabel()">{{ currentLabel() || placeholder() }}</span>
      <ng-icon name="bootstrapChevronDown" size="1rem" class="opacity-60 shrink-0" />
    </button>

    @if (isOpen()) {
      <div
        #panel
        class="lnk-select-panel"
        role="listbox"
        tabindex="-1"
        [style.left.px]="left()"
        [style.top.px]="top()"
        [style.min-width.px]="width()"
        (keydown)="onPanelKeydown($event)"
      >
        @if (allowEmpty()) {
          <button
            type="button"
            role="option"
            class="lnk-select-opt"
            [class.is-active]="!value()"
            [attr.aria-selected]="!value()"
            (click)="pick('')"
          >
            <span class="truncate lnk-select-ph">{{ placeholder() }}</span>
            @if (!value()) { <ng-icon name="bootstrapCheck2" size="1rem" class="shrink-0" /> }
          </button>
        }
        @for (o of normOptions(); track o.value) {
          <button
            type="button"
            role="option"
            class="lnk-select-opt"
            [class.is-active]="o.value === value()"
            [attr.aria-selected]="o.value === value()"
            (click)="pick(o.value)"
          >
            <span class="truncate">{{ o.label }}</span>
            @if (o.value === value()) { <ng-icon name="bootstrapCheck2" size="1rem" class="shrink-0" /> }
          </button>
        }
      </div>
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
})
export class SelectComponent implements ControlValueAccessor {
  /** Opzioni: oggetti `{value,label}` oppure semplici stringhe (value=label). */
  readonly options = input<Array<SelectOption | string>>([]);
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  /** Mostra l'opzione "vuota" (clear) in cima. Disattivala per gli enum obbligatori. */
  readonly allowEmpty = input(true);

  /** Opzioni normalizzate (stringa → `{value,label}`). */
  protected readonly normOptions = computed<SelectOption[]>(() =>
    this.options().map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  );

  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  protected readonly isOpen = signal(false);
  protected readonly left = signal(0);
  protected readonly top = signal(0);
  protected readonly width = signal(0);

  protected readonly currentLabel = computed(() => this.normOptions().find((o) => o.value === this.value())?.label ?? '');

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: unknown): void {
    this.value.set(typeof v === 'string' ? v : v == null ? '' : String(v));
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
    if (d) this.isOpen.set(false);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.isOpen.set(false);
      return;
    }
    const r = this.triggerRef().nativeElement.getBoundingClientRect();
    this.left.set(r.left);
    this.top.set(r.bottom + 4);
    this.width.set(r.width);
    this.isOpen.set(true);
    // Focus l'opzione attiva (o la prima) dopo il render del pannello.
    setTimeout(() => {
      const p = this.panelRef()?.nativeElement;
      const target = p?.querySelector<HTMLElement>('.is-active') ?? p?.querySelector<HTMLElement>('.lnk-select-opt') ?? p;
      target?.focus();
    });
  }

  protected pick(v: string): void {
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
    this.isOpen.set(false);
    this.triggerRef().nativeElement.focus();
  }

  protected onTriggerKeydown(e: KeyboardEvent): void {
    if ((e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') && !this.isOpen()) {
      e.preventDefault();
      this.toggle();
    }
  }

  protected onPanelKeydown(e: KeyboardEvent): void {
    const opts = Array.from(this.panelRef()?.nativeElement.querySelectorAll<HTMLButtonElement>('.lnk-select-opt') ?? []);
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        opts[Math.min(opts.length - 1, i + 1)]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        opts[Math.max(0, i - 1)]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        opts[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        opts[opts.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        this.isOpen.set(false);
        this.triggerRef().nativeElement.focus();
        break;
    }
  }

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (!this.isOpen()) return;
    if (target instanceof Node && !this.host.nativeElement.contains(target)) this.isOpen.set(false);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    if (this.isOpen()) this.isOpen.set(false);
  }
}
