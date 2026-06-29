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

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LNK_IN_DETAIL_GROUP } from '../detail-group/detail-group.token';

/**
 * Sezione di una pagina di dettaglio: titolo i18n + slot contenuto.
 *
 * Due varianti visive controllate via `variant`:
 * - `'card'`: card autonoma con bordo, bg e shadow (default fuori
 *   da un `<lnk-detail-group>`).
 * - `'embedded'`: niente bordo/bg/shadow, solo titolo + divider sotto;
 *   pensata per essere figlia di un `<lnk-detail-group>` che fa da
 *   container visivo.
 * - `'auto'` (default): la sezione legge il contesto e diventa
 *   `embedded` automaticamente se annidata in un `<lnk-detail-group>`,
 *   altrimenti `card`.
 *
 *   ```html
 *   <lnk-detail-section titleKey="Pendenze.Detail.Generali">
 *     <lnk-info-grid [items]="..." />
 *   </lnk-detail-section>
 *   ```
 */
@Component({
  selector: 'lnk-detail-section',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'effectiveVariant()',
  },
  styles: `
    :host { display: block; }
    /* Spaziatura verticale tra sezioni consecutive. Differenziata per
       variant: card autonoma = 1.5rem, embedded (dentro group) = 1rem
       (corrisponde al space-y-4 del container originale). L'ultima
       o l'unica non riceve margin-bottom. */
    :host([data-variant='card']):not(:last-of-type) { margin-bottom: 1.5rem; }
    :host([data-variant='embedded']):not(:last-of-type) { margin-bottom: 1rem; }
  `,
  template: `
    <section [class]="sectionClass()">
      <header [class]="headerClass()">
        <h2 [class]="titleClass()">
          {{ titleKey() | translate }}
        </h2>
      </header>
      <div [class]="contentClass">
        <ng-content />
      </div>
    </section>
  `,
})
export class DetailSectionComponent {
  readonly titleKey = input.required<string>();

  /**
   * - `'card'`: bordo + bg + shadow.
   * - `'embedded'`: niente bordo/bg/shadow, ma stessi padding di card
   *   (`px-4 py-3` header con divider sotto, `p-4` content). Pensata
   *   per essere figlia di `<lnk-detail-group>`.
   * - `'auto'` (default): `embedded` se dentro un `<lnk-detail-group>`,
   *   `card` altrimenti.
   */
  readonly variant = input<'card' | 'embedded' | 'auto'>('auto');

  /** True se la section e` annidata in un `<lnk-detail-group>`. */
  private readonly inGroup = inject(LNK_IN_DETAIL_GROUP, { optional: true }) ?? false;

  /** Variant effettivo dopo risoluzione `'auto'`. Esposto come attributo
   *  host `data-variant` per gli stili `:host` differenziati per variant. */
  protected readonly effectiveVariant = computed<'card' | 'embedded'>(() => {
    const v = this.variant();
    if (v === 'auto') return this.inGroup ? 'embedded' : 'card';
    return v;
  });

  protected readonly sectionClass = computed(() =>
    this.effectiveVariant() === 'card'
      ? 'rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]'
      : '',
  );

  /**
   * Classi del wrapper `<header>` differenziate per variant.
   *
   * - `card`: divider sotto l'header come prima (`border-b` su tutta la
   *   larghezza della card, indented dal `px-4`).
   * - `embedded`: nessun border sul wrapper; il divider sotto il titolo
   *   viene applicato direttamente al `<h2>` (vedi `titleClass`) cosi`
   *   parte allineato col primo glifo del titolo invece di estendersi
   *   per tutta la larghezza dell'header dentro il group.
   */
  protected readonly headerClass = computed(() =>
    this.effectiveVariant() === 'card'
      ? 'px-4 py-3 border-b border-[var(--card-border)]'
      : 'px-4 pt-3',
  );

  /**
   * Classi del `<h2>` titolo. In variant `embedded` aggiunge `pb-3` +
   * `border-b` per ottenere un divider allineato a sinistra col testo
   * del titolo (e non rientrato di `px-4` come sarebbe se il border
   * fosse sull'`<header>`).
   */
  protected readonly titleClass = computed(() => {
    const base = 'text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]';
    return this.effectiveVariant() === 'embedded'
      ? `${base} pb-3 border-b border-[var(--card-border)]`
      : base;
  });

  protected readonly contentClass = 'p-4';
}
