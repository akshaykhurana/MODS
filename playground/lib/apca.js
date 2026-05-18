import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { isDark } from './live-tokens.js';

export const APCA_MIN_LC = 60;

export function apcaLc(txt, bg) {
  return APCAcontrast(sRGBtoY([txt.r, txt.g, txt.b]), sRGBtoY([bg.r, bg.g, bg.b]));
}

export function compositeRGB(fg, a, bg) {
  return {
    r: Math.round(a * fg.r + (1 - a) * bg.r),
    g: Math.round(a * fg.g + (1 - a) * bg.g),
    b: Math.round(a * fg.b + (1 - a) * bg.b),
  };
}

const resolveToRGBCache = new Map();

export function resolveToRGB(expr) {
  if (resolveToRGBCache.has(expr)) return resolveToRGBCache.get(expr);
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;';
  el.style.color = expr;
  document.body.appendChild(el);
  const c = window.getComputedStyle(el).color;
  el.remove();
  const m = c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const result = m ? { r: +m[1], g: +m[2], b: +m[3] } : { r: 0, g: 0, b: 0 };
  resolveToRGBCache.set(expr, result);
  return result;
}

function getCSSAlpha(varName) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(varName).trim()) || 0;
}

function buildAPCATable(containerId, rowTokens, colSurfaces) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let html = '<table class="pg-apca-table"><thead><tr><th></th>';
  colSurfaces.forEach(s => { html += `<th>${s.label}</th>`; });
  html += '</tr></thead><tbody>';
  rowTokens.forEach(tok => {
    html += `<tr><td class="pg-apca-row-label">${tok.label}</td>`;
    colSurfaces.forEach(surf => {
      const effective = tok.alpha < 1
        ? compositeRGB(tok.rgb, tok.alpha, surf.rgb)
        : tok.rgb;
      const lc = apcaLc(effective, surf.rgb);
      const display = lc === 0 ? '0' : (lc > 0 ? '+' : '') + Math.round(lc);
      html += `<td class="pg-apca-cell">${display}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function buildDualAPCATable(containerId, leftTokens, rightTokens, leftTitle, rightTitle, colSurfaces) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const nCols = colSurfaces.length;
  const nRows = Math.max(leftTokens.length, rightTokens.length);
  const colHeaders = colSurfaces.map(s => `<th>${s.label.toUpperCase()}</th>`).join('');

  let html = '<table class="pg-apca-table"><thead>';
  html += '<tr>';
  html += `<th colspan="${nCols + 1}" class="pg-apca-section-label">${leftTitle}</th>`;
  html += '<th class="pg-apca-divider"></th>';
  html += `<th colspan="${nCols + 1}" class="pg-apca-section-label">${rightTitle}</th>`;
  html += '</tr>';
  html += `<tr><th></th>${colHeaders}<th class="pg-apca-divider"></th><th></th>${colHeaders}</tr>`;
  html += '</thead><tbody>';

  function renderCells(tok, surfaces) {
    let out = `<td class="pg-apca-row-label">${tok.label}</td>`;
    surfaces.forEach(surf => {
      const effective = tok.alpha < 1 ? compositeRGB(tok.rgb, tok.alpha, surf.rgb) : tok.rgb;
      const lc = apcaLc(effective, surf.rgb);
      const display = lc === 0 ? '0' : (lc > 0 ? '+' : '') + Math.round(lc);
      out += `<td class="pg-apca-cell">${display}</td>`;
    });
    return out;
  }

  function emptyCells(surfaces) {
    return `<td></td>` + surfaces.map(() => '<td></td>').join('');
  }

  for (let i = 0; i < nRows; i++) {
    html += '<tr>';
    html += leftTokens[i]  ? renderCells(leftTokens[i], colSurfaces) : emptyCells(colSurfaces);
    html += '<td class="pg-apca-divider"></td>';
    html += rightTokens[i] ? renderCells(rightTokens[i], colSurfaces) : emptyCells(colSurfaces);
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

export function rebuildAPCA() {
  resolveToRGBCache.clear();
  const sAlpha = getCSSAlpha('--surfaces-global-alpha') || 0.93;
  const baseRGB = resolveToRGB('rgb(var(--surfaces-base-color))');

  const surfaces = [
    { label: 'base', rgb: baseRGB },
    { label: 'l1', rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l1-color))'), sAlpha, baseRGB) },
    { label: 'l2', rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l2-color))'), sAlpha, baseRGB) },
    { label: 'l2a', rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l2a-color))'), sAlpha, baseRGB) },
    { label: 'l3', rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l3-color))'), sAlpha, baseRGB) },
    { label: 'l4', rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l4-color))'), sAlpha, baseRGB) },
    { label: 'l5', rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l5-color))'), sAlpha, baseRGB) },
  ];

  const m = isDark() ? 'dark' : 'light';
  const aHigh = getCSSAlpha(`--text-high-${m}-alpha`) || 1;
  const aMid = getCSSAlpha(`--text-medium-${m}-alpha`) || 0.87;
  const aLow = getCSSAlpha(`--text-low-${m}-alpha`) || 0.60;
  const aDis = getCSSAlpha(`--text-disabled-${m}-alpha`) || 0.38;
  const aAccHigh = getCSSAlpha(`--text-accent-high-${m}-alpha`) || 0.85;
  const aAccMid = getCSSAlpha(`--text-accent-medium-${m}-alpha`) || 0.60;
  const aAccLow = getCSSAlpha(`--text-accent-low-${m}-alpha`) || 0.38;

  const textColorRGB = resolveToRGB('rgb(var(--text-color))');
  const accentRGB = resolveToRGB('rgb(var(--text-accent-color))');
  const accentTokens = [
    { label: 'High (Lc>90 Fluent Text)', rgb: accentRGB, alpha: aAccHigh },
    { label: 'Medium (Lc>75 Body Text)', rgb: accentRGB, alpha: aAccMid },
    { label: 'Low (Lc>60 Context Text)', rgb: accentRGB, alpha: aAccLow },
  ];
  const textTokens = [
    { label: 'High (Lc>90 Fluent Text)', rgb: textColorRGB, alpha: aHigh },
    { label: 'Medium (Lc>75 Body Text)', rgb: textColorRGB, alpha: aMid },
    { label: 'Low (Lc>60 Context Text)', rgb: textColorRGB, alpha: aLow },
    { label: 'Disabled (Lc>30 Spot Text)', rgb: textColorRGB, alpha: aDis },
  ];

  const aOverlayHover = getCSSAlpha('--action-overlay-hover-global-alpha') || 0.12;
  const aOverlayPressed = getCSSAlpha('--action-overlay-pressed-global-alpha') || 0.22;
  const primaryDefaultRGB = resolveToRGB('rgb(var(--action-primary-default-color))');
  const primaryOverlayRGB = resolveToRGB('rgb(var(--action-primary-overlay-color))');
  const secondaryDefaultRGB = resolveToRGB('rgb(var(--action-secondary-default-color))');
  const secondaryOverlayRGB = resolveToRGB('rgb(var(--action-secondary-overlay-color))');
  const actionTokens = [
    { label: 'primary-default', rgb: primaryDefaultRGB, alpha: 1 },
    { label: 'primary-overlay (hover)', rgb: compositeRGB(primaryOverlayRGB, aOverlayHover, primaryDefaultRGB), alpha: 1 },
    { label: 'primary-overlay (pressed)', rgb: compositeRGB(primaryOverlayRGB, aOverlayPressed, primaryDefaultRGB), alpha: 1 },
    { label: 'secondary-default', rgb: secondaryDefaultRGB, alpha: 1 },
    { label: 'secondary-overlay (hover)', rgb: compositeRGB(secondaryOverlayRGB, aOverlayHover, secondaryDefaultRGB), alpha: 1 },
    { label: 'secondary-overlay (pressed)', rgb: compositeRGB(secondaryOverlayRGB, aOverlayPressed, secondaryDefaultRGB), alpha: 1 },
  ];

  const borderColor = resolveToRGB('rgb(var(--border-color))');
  const aBHigh = getCSSAlpha(`--border-high-${m}-alpha`) || 0.87;
  const aBMid = getCSSAlpha(`--border-medium-${m}-alpha`) || 0.38;
  const aBLow = getCSSAlpha(`--border-low-${m}-alpha`) || 0.12;
  const aBFoc = getCSSAlpha('--border-focus-global-alpha') || 1;
  const borderTokens = [
    { label: 'high', rgb: borderColor, alpha: aBHigh },
    { label: 'medium', rgb: borderColor, alpha: aBMid },
    { label: 'low', rgb: borderColor, alpha: aBLow },
    { label: 'focus', rgb: resolveToRGB('rgb(var(--border-focus-color))'), alpha: aBFoc },
  ];

  buildDualAPCATable('apca-text-combined', accentTokens, textTokens,
    'Accent text tokens on surfaces', 'On-surface text tokens on surfaces', surfaces);
  buildAPCATable('apca-action-table', actionTokens, surfaces);
  buildAPCATable('apca-border-table', borderTokens, surfaces);
}

