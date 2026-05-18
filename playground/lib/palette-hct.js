import { Hct, argbFromRgb, redFromArgb, greenFromArgb, blueFromArgb } from '@material/material-color-utilities';

export function rgbStrToHex(rgbStr) {
  const [r, g, b] = rgbStr.trim().split(/\s+/).map(Number);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function rgbStrToHct(rgbStr) {
  const [r, g, b] = rgbStr.trim().split(/\s+/).map(Number);
  const hct = Hct.fromInt(argbFromRgb(r, g, b));
  return { h: Math.round(hct.hue), c: Math.round(hct.chroma), t: Math.round(hct.tone) };
}

export function hctToRgbStr(h, c, t) {
  const argb = Hct.from(h, c, t).toInt();
  return `${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)}`;
}
