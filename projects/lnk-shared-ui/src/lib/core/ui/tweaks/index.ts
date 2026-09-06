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

/**
 * Tweaks panel — infrastruttura UI di layout (singleton).
 *
 * I feature components importano `TweaksRegistry` e i tipi (`TweakRow`,
 * `TweakSectionDef`, `TweakSegmentedOption`) per registrare le proprie
 * sezioni; non hanno motivo di toccare i building blocks o l'host
 * globale. Pubblicato via `@core/ui` per coerenza con altre primitive
 * di layout (snackbar, spinner, goto-top, profile-menu).
 */

// Tipi pubblici (contratto della registry)
export * from './tweaks-types';

// Servizio + host singleton
export * from './tweaks-registry.service';
export * from './global-tweaks-host.component';

// Building blocks (esportati per estensibilità futura, non usati
// direttamente dai feature components dopo il refactor a registry)
export * from './tweaks-panel.component';
export * from './tweak-section.component';
export * from './tweak-row.component';
export * from './tweak-toggle.component';
export * from './tweak-segmented.component';
export * from './tweak-global-section.component';
