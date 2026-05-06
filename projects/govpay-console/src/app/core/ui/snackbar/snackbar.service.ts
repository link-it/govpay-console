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

import { Injectable, signal } from '@angular/core';

export type SnackbarLevel = 'success' | 'info' | 'warning' | 'error';

export interface SnackbarMessage {
  id: number;
  level: SnackbarLevel;
  text: string;
  /** Durata in ms; se omessa default 5000. */
  duration?: number;
}

/**
 * Servizio snackbar globale, signal-based. Coda interna FIFO.
 * I messaggi si auto-rimuovono dopo `duration` ms.
 */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private nextId = 1;
  private readonly _messages = signal<SnackbarMessage[]>([]);
  readonly messages = this._messages.asReadonly();

  show(text: string, level: SnackbarLevel = 'info', duration = 5000): number {
    const id = this.nextId++;
    const msg: SnackbarMessage = { id, level, text, duration };
    this._messages.update((list) => [...list, msg]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  success(text: string, duration?: number): number {
    return this.show(text, 'success', duration);
  }

  info(text: string, duration?: number): number {
    return this.show(text, 'info', duration);
  }

  warning(text: string, duration?: number): number {
    return this.show(text, 'warning', duration);
  }

  error(text: string, duration = 8000): number {
    return this.show(text, 'error', duration);
  }

  dismiss(id: number): void {
    this._messages.update((list) => list.filter((m) => m.id !== id));
  }

  clear(): void {
    this._messages.set([]);
  }
}
