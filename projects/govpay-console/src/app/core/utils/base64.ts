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

/**
 * Codifica una stringa (UTF-8) in base64.
 *
 * Usa `TextEncoder` per gestire correttamente i caratteri multibyte, che
 * `btoa` da solo non supporta.
 */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Decodifica una stringa base64 (UTF-8). Ritorna la stringa originale se
 * l'input **non** è base64 valido (contenuto legacy grezzo o già decodificato),
 * così la funzione è sicura da usare su dati eterogenei.
 */
export function decodeBase64(b64: string): string {
  try {
    const clean = b64.replace(/\s/g, '');
    if (!clean) return '';
    const binary = atob(clean);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return b64;
  }
}
