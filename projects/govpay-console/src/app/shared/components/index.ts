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

export * from './data-table/data-table.component';
export * from './pagination/pagination.component';
export * from './page-header/page-header.component';
export * from './empty-state/empty-state.component';
export * from './loading/loading.component';
export * from './tabs/tabs.component';
export * from './search-input/search-input.component';
export * from './select-input/select-input.component';
export * from './date-input/date-input.component';
export * from './detail-section/detail-section.component';
export * from './info-grid/info-grid.component';
export * from './status-badge/status-badge.component';

// Driven-by-config rendering (alternativa al data-table tradizionale,
// porting da `core/ui/item-type` + `core/ui/item-row` di GovHub).
export * from './item-row/display-config.types';
export * from './item-row/display-config.loader';
export * from './item-type/item-type.component';
export * from './item-row/item-row.component';
export * from './item-list/item-list.component';

// Tweaks panel: l'infrastruttura (registry, host, building blocks, tipi)
// vive in `@core/ui/tweaks` (UI di layout, allineato a snackbar/spinner/
// goto-top). Le costanti delle liste (`VIEW_OPTIONS`, `DATE_RANGE_OPTIONS`,
// `matchDateRangePreset`) sono in `@shared/utils/list-tweaks-options.ts`,
// ri-esportate dal barrel `@shared`.
