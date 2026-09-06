/*
 * Generatore dei temi "accent-based" per @linkit/shared-ui.
 *
 * Ogni tema è una variazione dello stesso schema (BrandingConfig) attorno a un
 * colore d'accento: sfondi come tinte leggere dell'accento (chiaro) o neutro
 * caldo (scuro). I temi curati a mano (govpay, gold, caramel) NON sono qui.
 *
 *   node scripts/gen-themes.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../projects/govpay-console/src/assets/config/themes');

// --- color helpers -------------------------------------------------------
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const h2 = (n) => clamp(n).toString(16).padStart(2, '0');
const parse = (h) => { const s = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)); };
const toHex = ([r, g, b]) => `#${h2(r)}${h2(g)}${h2(b)}`;
/** Mix: peso `w` del colore `a`, resto `b`. */
const mix = (a, b, w) => { const A = parse(a), B = parse(b); return toHex(A.map((v, i) => v * w + B[i] * (1 - w))); };
const darken = (a, w) => mix(a, '#000000', w);
const lighten = (a, w) => mix(a, '#ffffff', w);
const lum = (h) => { const [r, g, b] = parse(h).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const rgbList = (h) => parse(h).join(' ');

const WHITE = '#ffffff';
const INK = '#1e1b18';
const MUTED_FG = '#6f6a63';

function buildTheme(accent, font = 'Prompt') {
  const onPrimary = lum(accent) > 0.6 ? '#1f1d1a' : '#ffffff';
  const primaryHover = darken(accent, 0.88);
  const canvas = mix(accent, WHITE, 0.07);
  const muted = mix(accent, WHITE, 0.12);
  const border = mix(accent, WHITE, 0.22);
  const itemHover = mix(accent, WHITE, 0.14);
  const itemActive = mix(accent, WHITE, 0.2);
  const itemActiveText = darken(accent, 0.82);

  // dark: neutro caldo, accento invariato
  const dBg = '#14120f';
  const dCard = '#1d1a16';
  const dBorder = '#2c2822';
  const dBorder2 = '#3a352c';
  const dText = '#e8e6e3';
  const dMutedFg = '#a1998e';
  const dActiveText = lighten(accent, 0.6);

  return {
    logo: {
      full: 'assets/images/logo/LINK_logo-Govpay.svg',
      compact: 'assets/images/logo/LINK_GovPay-icon.svg',
      showTitle: true,
      fallbackText: 'GP',
    },
    primaryColor: accent,
    secondaryColor: INK,
    theme: {
      topBar: { background: WHITE, text: INK, border, height: '3.5rem' },
      header: { background: WHITE, text: INK, border, showShadow: false },
      sidebar: {
        background: WHITE, border, text: INK, textSecondary: MUTED_FG,
        itemHover: `${itemHover}80`, itemActive, itemActiveText,
        footerBackground: WHITE, footerBorder: border,
      },
      content: {
        background: canvas, text: INK, cardBackground: WHITE, cardBorder: border,
        cardHover: canvas, muted, mutedForeground: MUTED_FG,
      },
      buttons: {
        primaryBackground: accent, primaryText: onPrimary, primaryHover,
        secondaryBackground: WHITE, secondaryText: INK, secondaryBorder: border,
        secondaryHover: `${itemHover}80`,
      },
      tabs: {
        shared: { textActive: INK, fontWeightActive: 600 },
        underline: { indicatorColor: accent, indicatorSize: '3px', trackBorder: border },
        segmented: {
          trackBackground: muted, trackRadius: '0.75rem', pillBackground: accent,
          pillText: onPrimary, pillShadow: `0 1px 3px rgb(${rgbList(accent)} / 0.35)`,
          badgeBackgroundActive: onPrimary === '#ffffff' ? '#ffffff33' : '#1f1d1a1a',
          badgeTextActive: onPrimary,
        },
      },
      fonts: { primary: { family: font } },
      success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', info: '#0071a9',
      dark: {
        topBar: { background: dBg, text: dText, border: dBorder },
        header: { background: dBg, text: dText, border: dBorder, showShadow: false },
        sidebar: {
          background: dBg, border: dBorder, text: dText, textSecondary: dMutedFg,
          itemHover: dBorder, itemActive: dBorder, itemActiveText: dActiveText,
          footerBackground: dBg, footerBorder: dBorder,
        },
        content: {
          background: '#0e0c0a', text: dText, cardBackground: dCard, cardBorder: dBorder,
          cardHover: dBorder, muted: dBorder, mutedForeground: dMutedFg,
        },
        buttons: {
          primaryBackground: accent, primaryText: onPrimary, primaryHover,
          secondaryBackground: dBorder, secondaryText: dText, secondaryBorder: dBorder2, secondaryHover: dBorder2,
        },
        tabs: {
          shared: { textActive: dText },
          underline: { trackBorder: dBorder },
          segmented: {
            trackBackground: dBorder, pillBackground: accent, pillText: onPrimary,
            pillShadow: `0 1px 3px rgb(${rgbList(accent)} / 0.45)`,
          },
        },
        info: '#38bdf8',
      },
    },
  };
}

// id → { accent, font } (font opzionale, default 'Prompt')
const THEMES = {
  start: { accent: '#12b8a6' },
  router: { accent: '#37a93c', font: 'Roboto' },
  query: { accent: '#ef4b3b' },
  db: { accent: '#f6821f', font: 'Roboto' },
  ai: { accent: '#e5399a' },
  table: { accent: '#3b82f6', font: 'Inter' },
  hotkeys: { accent: '#f43f5e' },
  virtual: { accent: '#8b5cf6' },
  pacer: { accent: '#84cc16', font: 'Roboto' },
  config: { accent: '#475569', font: 'Inter' },
  cli: { accent: '#6366f1', font: 'Inter' },
  intent: { accent: '#0ea5e9' },
};

for (const [id, { accent, font }] of Object.entries(THEMES)) {
  const file = resolve(OUT, `${id}.json`);
  writeFileSync(file, JSON.stringify(buildTheme(accent, font), null, 2) + '\n');
  console.log(`✓ ${id}.json (${accent}${font ? ', ' + font : ''})`);
}
console.log(`\n${Object.keys(THEMES).length} temi generati in ${OUT}`);
