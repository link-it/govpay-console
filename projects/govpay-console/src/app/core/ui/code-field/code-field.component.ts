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

import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, type ControlValueAccessor, type ValidationErrors, type Validator } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Formato del contenuto gestito dal campo. */
export type CodeFieldFormat = 'json' | 'text' | 'auto';

/**
 * Campo per l'editing di un contenuto strutturato (**JSON**, template
 * **freemarker** o testo libero) caricabile da file o via **drag & drop**.
 *
 * A differenza di una semplice textarea, il contenuto è nascosto per default e
 * viene mostrato solo su richiesta ("Mostra"). La barra dei comandi espone
 * sempre il pulsante di caricamento e, quando un dato è presente, il pulsante
 * di reset.
 *
 * Il valore del form control:
 * - `format="json"`: oggetto già parsato (o `null`); JSON non valido →
 *   errore `{ json: true }`.
 * - `format="text"`: sempre la stringa grezza (nessuna validazione).
 * - `format="auto"` (default): oggetto se il testo è JSON valido, altrimenti la
 *   stringa grezza. Round-trip sicuro sia per oggetti sia per template
 *   freemarker (che non sono JSON valido).
 *
 * ```html
 * <lnk-code-field formControlName="validazione" format="json" [rows]="8" />
 * <lnk-code-field formControlName="messaggio" format="auto" [rows]="6" />
 * ```
 */
@Component({
  selector: 'lnk-code-field',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="rounded border transition-colors"
      [style.border-color]="borderColor()"
      [style.background-color]="dragging() ? 'color-mix(in srgb, var(--primary) 6%, transparent)' : null"
      (dragenter)="onDragEnter($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <!-- Barra comandi -->
      <div class="flex items-center gap-2 px-3 py-2">
        <ng-icon [name]="hasContent() ? 'bootstrapFileEarmarkCode' : 'bootstrapFileEarmark'" size="1rem" class="text-[var(--muted-foreground)] shrink-0" />
        <span class="text-xs text-[var(--muted-foreground)] truncate flex-1">
          @if (dragging()) {
            {{ 'CodeField.Drop' | translate }}
          } @else if (hasContent()) {
            {{ 'CodeField.Presente' | translate }} · {{ charCount() }} {{ 'CodeField.Caratteri' | translate }}
          } @else {
            {{ 'CodeField.Vuoto' | translate }}
          }
        </span>

        <button type="button" class="btn btn-ghost btn-sm" (click)="toggle()">
          <ng-icon [name]="expanded() ? 'bootstrapEyeSlash' : 'bootstrapEye'" size="1rem" />
          <span>{{ (expanded() ? 'CodeField.Nascondi' : 'CodeField.Mostra') | translate }}</span>
        </button>

        <label class="btn btn-ghost btn-sm" [class.opacity-60]="disabled()">
          <ng-icon name="bootstrapUpload" size="1rem" />
          <span>{{ 'CodeField.Carica' | translate }}</span>
          <input type="file" class="hidden" [attr.accept]="accept()" [disabled]="disabled()" (change)="onFile($event)" />
        </label>

        @if (hasContent()) {
          <button type="button" class="btn btn-ghost btn-sm" [disabled]="disabled()" (click)="reset()">
            <ng-icon name="bootstrapArrowCounterclockwise" size="1rem" />
            <span>{{ 'CodeField.Reset' | translate }}</span>
          </button>
        }
      </div>

      <!-- Editor (solo su richiesta) -->
      @if (expanded()) {
        <div class="px-3 pb-3">
          <textarea
            [rows]="rows()"
            [value]="text()"
            [disabled]="disabled()"
            [attr.placeholder]="placeholder()"
            spellcheck="false"
            class="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--card-bg)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            (input)="onInput($any($event.target).value)"
            (blur)="onBlur()"
          ></textarea>
          @if (invalid()) {
            <span class="text-xs text-[var(--status-danger-text)]">{{ 'CodeField.NonValido' | translate }}</span>
          }
        </div>
      } @else if (invalid()) {
        <div class="px-3 pb-2">
          <span class="text-xs text-[var(--status-danger-text)]">{{ 'CodeField.NonValido' | translate }}</span>
        </div>
      }
    </div>
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CodeFieldComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => CodeFieldComponent), multi: true },
  ],
})
export class CodeFieldComponent implements ControlValueAccessor, Validator {
  readonly rows = input(6);
  readonly placeholder = input('');
  readonly format = input<CodeFieldFormat>('auto');
  readonly accept = input('application/json,.json,.txt,.ftl,.html,.xml');

  protected readonly text = signal('');
  protected readonly invalid = signal(false);
  protected readonly disabled = signal(false);
  protected readonly expanded = signal(false);
  protected readonly dragging = signal(false);

  protected readonly hasContent = computed(() => this.text().trim().length > 0);
  protected readonly charCount = computed(() => this.text().length);
  protected readonly borderColor = computed(() =>
    this.invalid() ? 'var(--status-danger-text)' : this.dragging() ? 'var(--primary)' : 'var(--border)'
  );

  private dragDepth = 0;
  private onChange: (v: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: unknown): void {
    if (v == null || v === '') this.text.set('');
    else if (typeof v === 'string') this.text.set(v);
    else this.text.set(JSON.stringify(v, null, 2));
    this.invalid.set(false);
  }
  registerOnChange(fn: (v: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
  }

  validate(): ValidationErrors | null {
    return this.invalid() ? { json: true } : null;
  }

  protected toggle(): void {
    this.expanded.update((v) => !v);
  }

  protected onInput(value: string): void {
    this.text.set(value);
    this.emit();
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected reset(): void {
    this.text.set('');
    this.invalid.set(false);
    this.expanded.set(false);
    this.onChange(null);
    this.onTouched();
  }

  // --- Drag & drop ---

  protected onDragEnter(e: DragEvent): void {
    e.preventDefault();
    if (this.disabled()) return;
    this.dragDepth++;
    this.dragging.set(true);
  }

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    if (this.disabled()) return;
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }

  protected onDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.dragging.set(false);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragDepth = 0;
    this.dragging.set(false);
    if (this.disabled()) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  // --- File input ---

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.readFile(file);
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      let out = content;
      // Pretty-print se è JSON valido (salvo modalità text), altrimenti grezzo.
      if (this.format() !== 'text') {
        try {
          out = JSON.stringify(JSON.parse(content), null, 2);
        } catch {
          /* contenuto non-JSON: mantenuto grezzo */
        }
      }
      this.text.set(out);
      this.emit();
      this.onTouched();
    };
    reader.readAsText(file);
  }

  private emit(): void {
    const { value, error } = this.parse(this.text());
    this.invalid.set(error);
    this.onChange(error ? null : value);
  }

  /** Interpreta il testo secondo `format`, restituendo valore + flag errore. */
  private parse(text: string): { value: unknown; error: boolean } {
    if (!text.trim()) return { value: null, error: false };
    const fmt = this.format();
    if (fmt === 'text') return { value: text, error: false };
    try {
      return { value: JSON.parse(text), error: false };
    } catch {
      // json: errore; auto: stringa grezza (es. template freemarker).
      return fmt === 'json' ? { value: null, error: true } : { value: text, error: false };
    }
  }
}
