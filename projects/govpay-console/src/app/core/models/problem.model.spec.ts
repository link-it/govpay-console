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

import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { extractProblem, isProblem, problemDetail, type Problem } from './problem.model';

describe('problem.model', () => {
  const problem: Problem = { status: 400, title: 'Bad Request', detail: 'Filtro non supportato' };

  describe('isProblem', () => {
    it('riconosce un oggetto con status numerico', () => {
      expect(isProblem(problem)).toBe(true);
    });
    it('rifiuta null, primitivi e oggetti senza status', () => {
      expect(isProblem(null)).toBe(false);
      expect(isProblem('x')).toBe(false);
      expect(isProblem({ title: 'x' })).toBe(false);
      expect(isProblem({ status: '400' })).toBe(false);
    });
  });

  describe('extractProblem', () => {
    it('estrae il problem dal campo error di HttpErrorResponse', () => {
      const err = new HttpErrorResponse({ status: 400, error: problem });
      expect(extractProblem(err)).toEqual(problem);
    });
    it('ritorna null se error non è un problem+json', () => {
      const err = new HttpErrorResponse({ status: 500, error: 'plain text' });
      expect(extractProblem(err)).toBeNull();
    });
    it('accetta un problem passato direttamente', () => {
      expect(extractProblem(problem)).toEqual(problem);
    });
  });

  describe('problemDetail', () => {
    it('preferisce detail a title', () => {
      const err = new HttpErrorResponse({ status: 400, error: problem });
      expect(problemDetail(err)).toBe('Filtro non supportato');
    });
    it('ripiega su title se manca detail', () => {
      const err = new HttpErrorResponse({ status: 400, error: { status: 400, title: 'Bad Request' } });
      expect(problemDetail(err)).toBe('Bad Request');
    });
    it('accoda gli errori di validazione per campo', () => {
      const err = new HttpErrorResponse({
        status: 400,
        error: { status: 400, detail: 'Validazione fallita', errors: [{ field: 'numeroAvviso', message: '18 cifre' }] },
      });
      expect(problemDetail(err)).toBe('Validazione fallita — numeroAvviso: 18 cifre');
    });
    it('usa il fallback quando non c’è un problem riconoscibile', () => {
      const err = new HttpErrorResponse({ status: 0, error: null });
      expect(problemDetail(err, 'Errore di rete')).toBeTruthy();
      expect(problemDetail({}, 'Errore generico')).toBe('Errore generico');
    });
  });
});
