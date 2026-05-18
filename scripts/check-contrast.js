#!/usr/bin/env node
/**
 * APCA contrast check on key semantic pairs (light mode baseline).
 * Exit 1 if any pair falls below MIN_LC.
 */
const fs = require('fs');
const path = require('path');
const { APCAcontrast, sRGBtoY } = require('apca-w3');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'src', '_base.css');
const SEMANTIC = path.join(ROOT, 'src', '_semantic-tokens.css');
const MIN_LC = 60;

function parsePalette(content) {
  const palette = {};
  const re = /--([psnryg]\d+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    palette[m[1]] = m[2].trim().replace(/\s+/g, ' ').split(' ').map(Number);
  }
  return palette;
}

function parseNumericVars(content) {
  const nums = {};
  const re = /--([\w-]+):\s*([\d.]+)\s*;/g;
  let m;
  while ((m = re.exec(content)) !== null) nums['--' + m[1]] = parseFloat(m[2]);
  return nums;
}

function extractMappings(block) {
  const map = {};
  const re = /(--[\w-]+):\s*var\(--([\w-]+)\)/g;
  let m;
  while ((m = re.exec(block)) !== null) map[m[1]] = m[2];
  return map;
}

function resolveVar(name, maps, palette, depth = 0) {
  if (depth > 12) return null;
  if (palette[name]) return palette[name];
  const key = name.startsWith('--') ? name : '--' + name;
  const next = maps[key];
  if (!next) return null;
  if (palette[next]) return palette[next];
  return resolveVar(next, maps, palette, depth + 1);
}

function rgbChannels(ch) {
  return { r: ch[0], g: ch[1], b: ch[2] };
}

function apcaLc(fg, bg) {
  return APCAcontrast(
    sRGBtoY([fg.r, fg.g, fg.b]),
    sRGBtoY([bg.r, bg.g, bg.b])
  );
}

function composite(fg, a, bg) {
  return {
    r: Math.round(a * fg.r + (1 - a) * bg.r),
    g: Math.round(a * fg.g + (1 - a) * bg.g),
    b: Math.round(a * fg.b + (1 - a) * bg.b),
  };
}

function main() {
  const baseContent = fs.readFileSync(BASE, 'utf8');
  const semContent = fs.readFileSync(SEMANTIC, 'utf8');
  const darkIdx = semContent.match(/^\.dark\s*\{/m)?.index ?? -1;
  const rootPart = darkIdx !== -1 ? semContent.slice(0, darkIdx) : semContent;

  const palette = parsePalette(baseContent);
  const maps = extractMappings(rootPart);
  const nums = { ...parseNumericVars(baseContent), ...parseNumericVars(rootPart) };

  const sAlpha = nums['--surfaces-global-alpha'] ?? 0.93;
  const textHighA = nums['--text-high-light-alpha'] ?? 1;

  const baseCh = resolveVar('surfaces-base-light-color', maps, palette);
  const l2Ch = resolveVar('surfaces-l2-light-color', maps, palette);
  const textCh = resolveVar('text-light-color', maps, palette);
  const primaryCh = resolveVar('action-primary-default-light-color', maps, palette);
  const labelCh = resolveVar('action-primary-label-light-color', maps, palette);

  if (!baseCh || !l2Ch || !textCh) {
    console.error('check-contrast: could not resolve required palette steps');
    process.exit(1);
  }

  const baseRgb = rgbChannels(baseCh);
  const l2Rgb = composite(rgbChannels(l2Ch), sAlpha, baseRgb);
  const textRgb = composite(rgbChannels(textCh), textHighA, l2Rgb);

  const pairs = [
    { label: 'text-high on surface-l2', fg: textRgb, bg: l2Rgb },
  ];

  if (primaryCh && labelCh) {
    const primaryRgb = rgbChannels(primaryCh);
    const labelResolved = resolveVar(labelCh, maps, palette);
    if (labelResolved) {
      const labelRgb = rgbChannels(labelResolved);
      pairs.push({
        label: 'primary label on primary button',
        fg: composite(labelRgb, textHighA, primaryRgb),
        bg: primaryRgb,
      });
    }
  }

  let failed = false;
  for (const p of pairs) {
    const lc = Math.abs(apcaLc(p.fg, p.bg));
    const ok = lc >= MIN_LC;
    console.log(`${ok ? 'OK' : 'FAIL'}  ${p.label}: Lc ${Math.round(lc)} (min ${MIN_LC})`);
    if (!ok) failed = true;
  }

  if (failed) process.exit(1);
}

main();
