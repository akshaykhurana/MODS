import { APCAcontrast, sRGBtoY } from 'apca-w3';

/* =====================================================================
   PLAYGROUND EDITOR — live palette + semantic token editing
   ===================================================================== */

// ── Local palette state ───────────────────────────────────────────────
let localPalette = {};  // { p10: '0 25 68', ... } — full flat copy
let paletteMode  = 'patch'; // 'patch' = diff only | 'full' = rewrite all

// ── Palette var options for <select> dropdowns (rebuilt dynamically) ──
let PALETTE_OPTS = [
  { group: 'Primary',   vars: ['p0','p5','p10','p15','p20','p25','p30','p35','p40','p50','p60','p70','p80','p90','p95','p98','p99','p100'] },
  { group: 'Secondary', vars: ['s0','s5','s10','s15','s20','s25','s30','s35','s40','s50','s60','s70','s80','s90','s95','s98','s99','s100'] },
  { group: 'Neutral',   vars: ['n10','n20','n30','n35','n40','n50','n60','n65','n70','n80','n90','n100'] },
  { group: 'Meaning',   vars: ['r30','r70','y30','y70','g30','g70'] },
];

function numSuffix(name) { return parseInt(name.match(/\d+$/)[0], 10); }

// ── Named constants ───────────────────────────────────────────────────
const APCA_REBUILD_DEBOUNCE_MS = 40;
const NUDGE_SMALL              = 0.01;
const NUDGE_LARGE              = 0.1;
const DEFAULT_TEXT_ALPHAS      = { high: 1, medium: 0.87, low: 0.60, disabled: 0.38 };
const EMPHASIS_LEVELS          = ['border-low', 'border-medium', 'border-high'];

function paletteKeysByPrefix(prefix) {
  return Object.keys(localPalette)
    .filter(k => k.startsWith(prefix) && /^\d+$/.test(k.slice(prefix.length)))
    .sort((a, b) => numSuffix(a) - numSuffix(b));
}

function rebuildPaletteOpts() {
  PALETTE_OPTS = [
    { group: 'Primary',   vars: paletteKeysByPrefix('p') },
    { group: 'Secondary', vars: paletteKeysByPrefix('s') },
    { group: 'Neutral',   vars: paletteKeysByPrefix('n') },
    { group: 'Meaning',   vars: [...paletteKeysByPrefix('r'), ...paletteKeysByPrefix('y'), ...paletteKeysByPrefix('g')] },
  ];
}

function buildSelectOptions(selectedVar) {
  return PALETTE_OPTS.map(g => {
    const opts = g.vars.map(v =>
      `<option value="${v}"${v === selectedVar ? ' selected' : ''}>${v}</option>`
    ).join('');
    return `<optgroup label="${g.group}">${opts}</optgroup>`;
  }).join('');
}

// ── Palette swatch rendering ──────────────────────────────────────────
function makeSwatch(name, val) {
  return `<div class="pg-swatch" data-var="--${name}">` +
    `<div class="pg-swatch-color" style="background:rgb(${val})"></div>` +
    `<div class="pg-swatch-name">${name}</div>` +
    `<div class="pg-swatch-edit">` +
      `<span class="pg-swatch-val">${val}</span>` +
      `<button class="pg-swatch-pencil" title="Edit">&#9998;</button>` +
      `<input class="pg-swatch-input" type="text" spellcheck="false">` +
    `</div>` +
    `<button class="pg-swatch-delete" data-name="${name}" title="Delete">&times;</button>` +
  `</div>`;
}

function makeAddTile(prefix) {
  const isMeaning = prefix === 'meaning';
  const prefixSel = isMeaning
    ? `<select class="pg-add-prefix-sel"><option value="r">r</option><option value="y">y</option><option value="g">g</option></select>`
    : '';
  const placeholder = isMeaning ? 'r30' : `${prefix}50`;
  return `<div class="pg-add-tile" data-add-prefix="${prefix}">+ Add</div>` +
    `<div class="pg-add-form" data-form-prefix="${prefix}">` +
      prefixSel +
      `<input class="pg-add-name" type="text" placeholder="${placeholder}" spellcheck="false">` +
      `<input class="pg-add-rgb"  type="text" placeholder="R G B" spellcheck="false">` +
      `<div class="pg-add-form-btns">` +
        `<button class="pg-add-confirm">&#10003;</button>` +
        `<button class="pg-add-cancel">&#10007;</button>` +
      `</div>` +
    `</div>`;
}

function renderPaletteSection(containerId, prefixes) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const keys = prefixes.flatMap(pfx => paletteKeysByPrefix(pfx));
  const tilePrefix = prefixes.length === 1 ? prefixes[0] : 'meaning';
  el.innerHTML = keys.map(k => makeSwatch(k, localPalette[k])).join('') + makeAddTile(tilePrefix);
}

function refreshPaletteUI() { rebuildPaletteOpts(); initDropdowns(); }

function renderPaletteGroups() {
  renderPaletteSection('palette-p', ['p']);
  renderPaletteSection('palette-s', ['s']);
  renderPaletteSection('palette-n', ['n']);
  renderPaletteSection('palette-meaning', ['r', 'y', 'g']);
  refreshPaletteUI();
}

// ── In-use palette tags ───────────────────────────────────────────────
function refreshInUseTags() {
  const used = new Set();
  document.querySelectorAll('select').forEach(sel => {
    if (sel.value && localPalette[sel.value] !== undefined) used.add(sel.value);
  });
  ['palette-p', 'palette-s', 'palette-n', 'palette-meaning'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    container.querySelectorAll('.pg-swatch').forEach(swatch => {
      const key = swatch.dataset.var.replace(/^--/, '');
      let tag = swatch.querySelector('.pg-in-use-tag');
      if (used.has(key)) {
        if (!tag) {
          tag = document.createElement('div');
          tag.className = 'pg-in-use-tag';
          tag.textContent = 'in use';
          swatch.appendChild(tag);
        }
      } else {
        tag?.remove();
      }
    });
  });
}

// ── Dirty state ──────────────────────────────────────────────────────
const dirtyPalette     = new Map(); // patch-mode only: varName → rgb
const dirtySemanticL   = new Map();
const dirtySemanticD   = new Map();
const dirtySemanticRaw = new Map(); // raw non-var values e.g. --surfaces-alpha
const dirtyFonts       = new Map(); // '--font-{role}' | '--letter-spacing-{role}' → value
let   dirtyScale       = false;     // true when type scale grid has been edited

// ── Cached save-bar elements (queried once at load) ────────────────────
const statusEl   = document.getElementById('save-status');
const saveBtn    = document.getElementById('save-btn');
const discardBtn = document.getElementById('discard-btn');

function updateSaveBar() {
  const palCount = paletteMode === 'full' ? 1 : dirtyPalette.size;
  const total    = palCount + dirtySemanticL.size + dirtySemanticD.size + dirtySemanticRaw.size
                 + dirtyFonts.size + (dirtyScale ? 1 : 0);
  if (total === 0) {
    statusEl.className   = 'pg-save-status';
    statusEl.textContent = 'No unsaved changes';
    saveBtn.disabled     = true;
    discardBtn.disabled  = true;
  } else {
    statusEl.className   = 'pg-save-status has-changes';
    statusEl.textContent = `${total} unsaved change${total > 1 ? 's' : ''}`;
    saveBtn.disabled     = false;
    discardBtn.disabled  = false;
  }
}

function markDirty(swatchEl) { swatchEl.classList.add('dirty'); }
function clearAllDirty() {
  document.querySelectorAll('.pg-swatch.dirty').forEach(el => el.classList.remove('dirty'));
}

// ── Token store ───────────────────────────────────────────────────────
// Pub/sub registry: store.set() writes the CSS var then notifies all subscribers.
// Subscriber arrow functions resolve names (rebuildAPCA etc.) lazily at call time.
class TokenStore {
  #subs = new Set();
  set(cssVar, value) {
    document.documentElement.style.setProperty(cssVar, String(value));
    this.#subs.forEach(fn => fn(cssVar, value));
  }
  subscribe(fn) { this.#subs.add(fn); }
}
const store = new TokenStore();

// ── Input registry & TokenInput ────────────────────────────────────────
// Every alpha <input> registers itself here so the nudge handler can delegate
// without parsing values or dispatching synthetic events.
const inputRegistry = new WeakMap();

class TokenInput {
  constructor(el, cssVar, { precision = 100, aliasVar = null, aliasMode = null } = {}) {
    if (!el) return;
    this.el = el; this.cssVar = cssVar; this.precision = precision;
    this.aliasVar = aliasVar; this.aliasMode = aliasMode;
    el.addEventListener('change', () => this.#commit());
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.#commit(); el.blur(); }
      if (e.key === 'Escape') { el.blur(); }
    });
    inputRegistry.set(el, this);
  }
  nudge(delta) {
    const v = parseFloat(this.el.value);
    if (isNaN(v)) return;
    this.el.value = String(Math.min(1, Math.max(0, Math.round((v + delta) * this.precision) / this.precision)));
    this.#commit();
  }
  #commit() {
    const val = parseFloat(this.el.value.trim());
    if (isNaN(val) || val < 0 || val > 1) { this.el.style.borderColor = 'rgb(var(--meaning-error))'; return; }
    this.el.style.borderColor = '';
    const v = Math.round(val * this.precision) / this.precision;
    this.el.value = String(v);
    dirtySemanticRaw.set(this.cssVar, String(v));
    store.set(this.cssVar, v);
    if (this.aliasVar && this.aliasMode !== null && (this.aliasMode === 'dark') === isDark()) {
      store.set(this.aliasVar, v);
    }
  }
}

// ── Reactive side-effects (store subscribers) ─────────────────────────
// All APCA rebuilds, save-bar updates, and border label refreshes cascade
// from store.set() — no individual commit handler needs to call them.
let apcaTimer;
store.subscribe(() => { clearTimeout(apcaTimer); apcaTimer = setTimeout(rebuildAPCA, APCA_REBUILD_DEBOUNCE_MS); });
store.subscribe(() => updateSaveBar());
store.subscribe(cssVar => { if (cssVar.startsWith('--border')) updateBorderSwatchLabels(); });

document.addEventListener('change', e => {
  if (e.target.tagName === 'SELECT') refreshInUseTags();
});

// ── Semantic config from server ───────────────────────────────────────
let semanticConfig = { light: {}, dark: {} };

async function loadConfig() {
  try {
    const r = await fetch('/config');
    semanticConfig = await r.json();
    // Apply all saved raw values as inline CSS immediately so the APCA table
    // and inputs agree from page load — before any user interaction.
    Object.entries(semanticConfig.rawValues || {}).forEach(([cssVar, value]) => {
      document.documentElement.style.setProperty(cssVar, String(value));
    });
    // Seed alpha input from server config
    const alpha = semanticConfig.rawValues && semanticConfig.rawValues['--surfaces-global-alpha'];
    if (alpha) {
      const inp = document.getElementById('surfaces-alpha-input');
      if (inp) inp.value = alpha;
    }
    ['l1', 'l2', 'l3', 'l4', 'l5'].forEach(level => {
      const v = semanticConfig.rawValues && semanticConfig.rawValues[`--surfaces-${level}-global-blur`];
      if (v) { const i = document.getElementById(`surfaces-${level}-global-blur`); if (i) i.value = v; }
    });
    // Seed shadow colour dropdown
    const shadowColor = semanticConfig.light && semanticConfig.light['--shadow-color'];
    if (shadowColor) {
      const sel = document.getElementById('shadow-color-select');
      if (sel) sel.innerHTML = buildSelectOptions(shadowColor);
    }
    ['umbra', 'penumbra', 'ambient'].forEach(layer => {
      const v = semanticConfig.rawValues && semanticConfig.rawValues[`--shadow-${layer}-global-alpha`];
      if (v) { const i = document.getElementById(`shadow-${layer}-global-alpha`); if (i) i.value = v; }
    });
  } catch (e) {
    // server not running — dropdowns default to first option
  }
  initDropdowns();
  rebuildAPCA();
}

function isDark() { return document.body.classList.contains('dark'); }

function initTextControls() {
  const lightMap = semanticConfig.light    || {};
  const darkMap  = semanticConfig.dark     || {};
  const raw      = semanticConfig.rawValues || {};

  const osSelL = document.getElementById('text-onsurface-select-light');
  const osSelD = document.getElementById('text-onsurface-select-dark');
  if (osSelL) osSelL.innerHTML = buildSelectOptions(lightMap['--text-color'] || '');
  if (osSelD) osSelD.innerHTML = buildSelectOptions(darkMap['--text-color']  || '');

  const osPreview = document.getElementById('text-onsurface-preview');
  if (osPreview) osPreview.style.background = 'rgb(var(--text-color))';

  ['high', 'medium', 'low', 'disabled'].forEach(level => {
    ['light', 'dark'].forEach(mode => {
      const inp = document.getElementById(`text-${mode}-alpha-${level}`);
      if (inp && raw[`--text-${level}-${mode}-alpha`] !== undefined) inp.value = raw[`--text-${level}-${mode}-alpha`];
    });
  });

  const acSelL = document.getElementById('text-accent-select-light');
  const acSelD = document.getElementById('text-accent-select-dark');
  if (acSelL) acSelL.innerHTML = buildSelectOptions(lightMap['--text-accent-color'] || '');
  if (acSelD) acSelD.innerHTML = buildSelectOptions(darkMap['--text-accent-color']  || '');

  const acPreview = document.getElementById('text-accent-preview');
  if (acPreview) acPreview.style.background = 'rgb(var(--text-accent-color))';

  // Seed accent alpha inputs
  ['light', 'dark'].forEach(mode => {
    ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
      const inp = document.getElementById(`text-${mode}-alpha-${level}`);
      if (inp && raw[`--text-${level}-${mode}-alpha`] !== undefined) inp.value = raw[`--text-${level}-${mode}-alpha`];
    });
  });

  // ── Token meta labels — show resolved palette step ──────────────────
  const activeMap = isDark() ? darkMap : lightMap;
  const colorStep  = activeMap['--text-color']  || '';
  const modeKey    = isDark() ? 'dark' : 'light';
  ['high', 'medium', 'low', 'disabled'].forEach(level => {
    const el = document.getElementById(`meta-text-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${level}-${modeKey}-alpha`]
               || raw[`--text-${level}-alpha`]
               || String(DEFAULT_TEXT_ALPHAS[level]);
    const base = colorStep ? `(${colorStep})` : '';
    el.innerHTML = `--text-color ${base}<br>opacity ${level} (${alpha})`;
  });
  const accentStep = activeMap['--text-accent-color'] || '';
  const accentBase  = accentStep ? `--text-accent-color (${accentStep})` : '--text-accent-color';
  ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
    const el = document.getElementById(`meta-text-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${level}-${modeKey}-alpha`] || raw[`--text-${level}-alpha`] || '1';
    el.innerHTML = `${accentBase}<br>opacity ${level} (${alpha})`;
  });

  // ── Invert token meta labels ────────────────────────────────────────
  const invertColorStep = activeMap['--text-invert-color'] || '';
  ['high', 'medium', 'low', 'disabled'].forEach(level => {
    const el = document.getElementById(`meta-text-invert-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${level}-${modeKey}-alpha`]
               || raw[`--text-${level}-alpha`]
               || String(DEFAULT_TEXT_ALPHAS[level]);
    const base = invertColorStep ? `(${invertColorStep})` : '';
    el.innerHTML = `--text-invert-color ${base}<br>opacity ${level} (${alpha})`;
  });
  const invertAccentEl   = document.getElementById('meta-text-invert-accent');
  const invertAccentStep = activeMap['--text-invert-accent-color'] || '';
  const invertAccentBase = `--text-invert-accent-color${invertAccentStep ? ` (${invertAccentStep})` : ''}`;
  const invertAccentAlpha = raw[`--text-accent-${modeKey}-alpha`] || raw['--text-accent-alpha'] || '1';
  if (invertAccentEl) invertAccentEl.innerHTML = `${invertAccentBase}<br>opacity accent (${invertAccentAlpha})`;
  ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
    const el = document.getElementById(`meta-text-invert-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${level}-${modeKey}-alpha`] || raw[`--text-${level}-alpha`] || '1';
    el.innerHTML = `${invertAccentBase}<br>opacity ${level} (${alpha})`;
  });
}

function initBorderControls() {
  const lightMap = semanticConfig.light    || {};
  const darkMap  = semanticConfig.dark     || {};
  const raw      = semanticConfig.rawValues || {};

  const focSelL  = document.getElementById('border-focus-select-light');
  const focSelD  = document.getElementById('border-focus-select-dark');
  const baseSelL = document.getElementById('border-base-select-light');
  const baseSelD = document.getElementById('border-base-select-dark');
  if (focSelL)  focSelL.innerHTML  = buildSelectOptions(lightMap['--border-focus-color']  || '');
  if (focSelD)  focSelD.innerHTML  = buildSelectOptions(darkMap['--border-focus-color']   || '');
  if (baseSelL) baseSelL.innerHTML = buildSelectOptions(lightMap['--border-color']  || '');
  if (baseSelD) baseSelD.innerHTML = buildSelectOptions(darkMap['--border-color']   || '');

  const focPreview  = document.getElementById('border-focus-preview');
  const basePreview = document.getElementById('border-base-preview');
  if (focPreview)  { const s = (isDark() ? focSelD  : focSelL)?.value;  if (s) focPreview.style.background  = `rgb(var(--${s}))`;  }
  if (basePreview) { const s = (isDark() ? baseSelD : baseSelL)?.value; if (s) basePreview.style.background = `rgb(var(--${s}))`; }

  ['high', 'medium', 'low'].forEach(level => {
    ['light', 'dark'].forEach(mode => {
      const inp = document.getElementById(`border-${mode}-alpha-${level}`);
      if (inp && raw[`--border-${level}-${mode}-alpha`] !== undefined) inp.value = raw[`--border-${level}-${mode}-alpha`];
    });
  });
  const focAlpha = document.getElementById('border-focus-global-alpha');
  if (focAlpha && raw['--border-focus-global-alpha'] !== undefined) focAlpha.value = raw['--border-focus-global-alpha'];
  const bwInp = document.getElementById('border-global-width');
  if (bwInp && raw['--border-global-width'] !== undefined) bwInp.value = raw['--border-global-width'];
  const bwfInp = document.getElementById('border-focus-global-width');
  if (bwfInp && raw['--border-focus-global-width'] !== undefined) bwfInp.value = raw['--border-focus-global-width'];
}

function initDropdowns() {
  const lightMap = semanticConfig.light || {};
  const darkMap  = semanticConfig.dark  || {};
  document.querySelectorAll('.pg-swatch-select[data-mode="light"]').forEach(sel => {
    sel.innerHTML = buildSelectOptions(lightMap[sel.dataset.var] || '');
  });
  document.querySelectorAll('.pg-swatch-select[data-mode="dark"]').forEach(sel => {
    // Fall back to light value for tokens that are mode-independent (no .dark override).
    const val = darkMap[sel.dataset.var] !== undefined
      ? darkMap[sel.dataset.var]
      : (lightMap[sel.dataset.var] || '');
    sel.innerHTML = buildSelectOptions(val);
  });
  initTextControls();
  initBorderControls();
  refreshInUseTags();
}

// ── Pencil edit helpers ───────────────────────────────────────────────
function openPencil(btn) {
  const swatch  = btn.closest('.pg-swatch');
  const valSpan = swatch.querySelector('.pg-swatch-val');
  const input   = swatch.querySelector('.pg-swatch-input');
  valSpan.style.display = 'none';
  btn.style.display     = 'none';
  input.value           = valSpan.textContent.trim();
  input.style.display   = 'block';
  input.focus();
  input.select();
}

function commitPencil(input) {
  const swatch  = input.closest('.pg-swatch');
  if (!swatch) return;
  const varName = swatch.dataset.var;
  const bareKey = varName.replace(/^--/, '');
  const valSpan = swatch.querySelector('.pg-swatch-val');
  const pencil  = swatch.querySelector('.pg-swatch-pencil');
  const raw     = input.value.trim().replace(/\s+/g, ' ');
  const valid   = /^\d{1,3} \d{1,3} \d{1,3}$/.test(raw);
  if (!valid) { input.classList.add('invalid'); return; }
  input.classList.remove('invalid');
  document.documentElement.style.setProperty(varName, raw);
  swatch.querySelector('.pg-swatch-color').style.background = `rgb(${raw})`;
  valSpan.textContent = raw;
  localPalette[bareKey] = raw;
  if (paletteMode !== 'full') dirtyPalette.set(bareKey, raw);
  markDirty(swatch);
  updateSaveBar();
  rebuildAPCA();
  input.style.display   = 'none';
  valSpan.style.display = '';
  pencil.style.display  = '';
}

function cancelPencil(input) {
  const swatch  = input.closest('.pg-swatch');
  if (!swatch) return;
  const valSpan = swatch.querySelector('.pg-swatch-val');
  const pencil  = swatch.querySelector('.pg-swatch-pencil');
  input.classList.remove('invalid');
  input.style.display   = 'none';
  valSpan.style.display = '';
  pencil.style.display  = '';
}

// ── Add / Delete handlers ─────────────────────────────────────────────
function handleDelete(varName) {
  if (!localPalette[varName]) return;
  delete localPalette[varName];
  document.documentElement.style.removeProperty('--' + varName);
  paletteMode = 'full';
  updateSaveBar();
  rebuildAPCA();
  const prefix = varName.match(/^[a-z]+/)[0];
  if (prefix === 'r' || prefix === 'y' || prefix === 'g') { renderPaletteSection('palette-meaning', ['r', 'y', 'g']); }
  else if (prefix === 'p') { renderPaletteSection('palette-p', ['p']); }
  else if (prefix === 's') { renderPaletteSection('palette-s', ['s']); }
  else if (prefix === 'n') { renderPaletteSection('palette-n', ['n']); }
  refreshPaletteUI();
}

function openAddForm(tile) {
  tile.style.display = 'none';
  const form = tile.nextElementSibling;
  form.style.display = 'flex';
  const nameInput = form.querySelector('.pg-add-name');
  nameInput.value = '';
  nameInput.classList.remove('invalid');
  form.querySelector('.pg-add-rgb').value = '';
  form.querySelector('.pg-add-rgb').classList.remove('invalid');
  nameInput.focus();
}

function cancelAdd(form) {
  form.style.display = 'none';
  form.previousElementSibling.style.display = '';
}

function handleAdd(form) {
  const formPrefix = form.dataset.formPrefix;
  const prefixSel  = form.querySelector('.pg-add-prefix-sel');
  const prefix     = prefixSel ? prefixSel.value : formPrefix;
  const nameInput  = form.querySelector('.pg-add-name');
  const rgbInput   = form.querySelector('.pg-add-rgb');
  const name = nameInput.value.trim().toLowerCase();
  const rgb  = rgbInput.value.trim().replace(/\s+/g, ' ');
  const nameOk = new RegExp(`^${prefix}\\d+$`).test(name) && !localPalette[name];
  nameInput.classList.toggle('invalid', !nameOk);
  const rgbOk = /^\d{1,3} \d{1,3} \d{1,3}$/.test(rgb);
  rgbInput.classList.toggle('invalid', !rgbOk);
  if (!nameOk || !rgbOk) return;
  localPalette[name] = rgb;
  document.documentElement.style.setProperty('--' + name, rgb);
  paletteMode = 'full';
  updateSaveBar();
  rebuildAPCA();
  if (prefix === 'r' || prefix === 'y' || prefix === 'g') { renderPaletteSection('palette-meaning', ['r', 'y', 'g']); }
  else if (prefix === 'p') { renderPaletteSection('palette-p', ['p']); }
  else if (prefix === 's') { renderPaletteSection('palette-s', ['s']); }
  else if (prefix === 'n') { renderPaletteSection('palette-n', ['n']); }
  refreshPaletteUI();
}

// ── Event delegation — palette row actions ────────────────────────────
document.addEventListener('click', e => {
  if (e.target.matches('.pg-swatch-pencil'))      { openPencil(e.target); }
  else if (e.target.matches('.pg-swatch-delete')) { handleDelete(e.target.dataset.name); }
  else if (e.target.matches('.pg-add-tile'))      { openAddForm(e.target); }
  else if (e.target.matches('.pg-add-confirm'))   { handleAdd(e.target.closest('.pg-add-form')); }
  else if (e.target.matches('.pg-add-cancel'))    { cancelAdd(e.target.closest('.pg-add-form')); }
});
document.addEventListener('focusout', e => {
  if (e.target.matches('.pg-swatch-input')) { commitPencil(e.target); }
});
document.addEventListener('keydown', e => {
  if (!e.target.matches('.pg-swatch-input')) return;
  if (e.key === 'Enter')  { e.preventDefault(); commitPencil(e.target); }
  if (e.key === 'Escape') { e.preventDefault(); cancelPencil(e.target); }
});

// ── Live token target helper ────────────────────────────────────────
// Semantic tokens are declared in :root (light) and body.dark (dark).
// Inline styles on an element beat CSS class rules on that same element,
// but a rule on body beats an inline style set further up on html.
// So dark-mode overrides must be written to document.body, not documentElement.
function liveTokenTarget() {
  return isDark() ? document.body : document.documentElement;
}

// ── Semantic select (dropdown) ────────────────────────────────────────
function initSemanticSelects() {
  document.querySelectorAll('.pg-swatch-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const swatch  = sel.closest('.pg-swatch');
      const varName = sel.dataset.var;
      const mode    = sel.dataset.mode; // 'light' or 'dark'
      const chosen  = sel.value;
      // Apply live only when this select's mode is the active mode
      if ((mode === 'dark') === isDark()) {
        liveTokenTarget().style.setProperty(varName, `var(--${chosen})`);
      }
      const bareKey = varName.replace(/^--/, '');
      if (mode === 'dark') {
        dirtySemanticD.set(bareKey, chosen);
      } else {
        dirtySemanticL.set(bareKey, chosen);
      }
      if (swatch) markDirty(swatch);
      rebuildAPCA();
      updateSaveBar();
    });
  });
}

// ── Save ──────────────────────────────────────────────────────────────
async function save() {
  statusEl.className   = 'pg-save-status building';
  statusEl.textContent = 'Building…';
  saveBtn.disabled     = true;

  let palettePayload;
  if (paletteMode === 'full') {
    palettePayload = { mode: 'full', vars: localPalette };
  } else if (dirtyPalette.size > 0) {
    palettePayload = { mode: 'patch', changes: Object.fromEntries(dirtyPalette) };
  } else {
    palettePayload = {};
  }

  const payload = {
    palette:       palettePayload,
    semanticLight: Object.fromEntries(dirtySemanticL),
    semanticDark:  Object.fromEntries(dirtySemanticD),
    semanticRaw:   Object.fromEntries(dirtySemanticRaw),
    fonts:         Object.fromEntries(dirtyFonts),
    fontImports:   dirtyFonts.size > 0
                     ? [...loadedFonts.values()].map(e => ({ name: e.name, weights: [...e.weights], italic: e.italic }))
                     : null,
    scale:         dirtyScale ? { ...currentScaleValues } : null,
  };

  try {
    const r = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    statusEl.className   = 'pg-save-status building';
    statusEl.textContent = 'Building…';
  } catch (e) {
    statusEl.className   = 'pg-save-status error';
    statusEl.textContent = 'Error: ' + e.message;
    saveBtn.disabled     = false;
  }
}

document.getElementById('save-btn').addEventListener('click', save);
document.getElementById('discard-btn').addEventListener('click', () => {
  sessionStorage.setItem('pg-scroll', window.scrollY);
  window.location.reload();
});

// ── SSE hot-reload ────────────────────────────────────────────────────
function connectSSE() {
  const es = new EventSource('/events');
  es.addEventListener('message', e => {
    if (e.data === 'rebuild-done') {
      dirtyPalette.clear();
      dirtySemanticL.clear();
      dirtySemanticD.clear();
      dirtySemanticRaw.clear();
      dirtyFonts.clear();
      dirtyScale = false;
      paletteMode = 'patch';
      clearAllDirty();
      statusEl.className   = 'pg-save-status saved';
      statusEl.textContent = 'Saved — reloading…';
      setTimeout(() => {
        localStorage.setItem('pg-dark', isDark() ? '1' : '0');
        sessionStorage.setItem('pg-scroll', window.scrollY);
        window.location.reload();
      }, 400);
    }
    if (e.data === 'rebuild-error') {
      statusEl.className   = 'pg-save-status error';
      statusEl.textContent = 'Build error — check terminal';
      saveBtn.disabled = false;
    }
  });
  es.onerror = () => { setTimeout(connectSSE, 3000); };
}

// ── Dark mode toggle ──────────────────────────────────────────────────
const darkBtn = document.getElementById('darkToggle');
if (localStorage.getItem('pg-dark') === '1') {
  document.body.classList.add('dark');
  darkBtn.textContent = '\u2600 Light';
}
darkBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = isDark();
  darkBtn.textContent = dark ? '\u2600 Light' : '\u263E Dark';
  rebuildAPCA();
  updateBorderSwatchLabels();
  localStorage.setItem('pg-dark', dark ? '1' : '0');
  initDropdowns();
});

// ── Indeterminate checkboxes ──────────────────────────────────────────
document.querySelectorAll('.js-indeterminate').forEach(el => { el.indeterminate = true; });

// ── Init ──────────────────────────────────────────────────────────────
async function loadPalette() {
  try {
    const r    = await fetch('/palette');
    const data = await r.json(); // { p: [{name,val},...], s:[...], ... }
    localPalette = {};
    for (const items of Object.values(data)) {
      for (const { name, val } of items) {
        localPalette[name] = val;
        document.documentElement.style.setProperty('--' + name, val);
      }
    }
  } catch (e) {
    // server not running — palette section stays empty
  }
  renderPaletteGroups();
  await loadConfig(); // applies rawValues as inline CSS, seeds inputs, then rebuilds APCA
}

// ── Shadow colour + alpha inputs ─────────────────────────────────────
(function () {
  // Shadow colour — palette step dropdown (mode-independent)
  const sel = document.getElementById('shadow-color-select');
  if (sel) {
    sel.addEventListener('change', () => {
      const chosen = sel.value;
      document.documentElement.style.setProperty('--shadow-color', `var(--${chosen})`);
      dirtySemanticL.set('shadow-color', chosen);
      updateSaveBar();
    });
  }

  // Shadow alpha inputs — umbra, penumbra, ambient
  ['umbra', 'penumbra', 'ambient'].forEach(layer => {
    new TokenInput(document.getElementById(`shadow-${layer}-global-alpha`), `--shadow-${layer}-global-alpha`);
  });
})();

// ── Surfaces blur inputs (per level) ────────────────────────────────
['l1', 'l2', 'l3', 'l4', 'l5'].forEach(level => {
  const inp = document.getElementById(`surfaces-${level}-global-blur`);
  if (!inp) return;
  function commitBlur() {
    const raw = inp.value.trim();
    if (!/^\d+(\.\d+)?(px|rem|em)$/.test(raw)) { inp.style.borderColor = 'rgb(var(--meaning-error))'; return; }
    inp.style.borderColor = '';
    document.documentElement.style.setProperty(`--surfaces-${level}-global-blur`, raw);
    dirtySemanticRaw.set(`--surfaces-${level}-global-blur`, raw);
    updateSaveBar();
  }
  inp.addEventListener('change', commitBlur);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commitBlur(); inp.blur(); }
    if (e.key === 'Escape') { inp.blur(); }
  });
});

// ── Surfaces alpha input ─────────────────────────────────────────────
new TokenInput(document.getElementById('surfaces-alpha-input'), '--surfaces-global-alpha');

// ── Text colour / alpha controls ──────────────────────────────────────
const TEXT_ON_SURFACE_VARS = ['--text-color'];
const TEXT_INVERT_VARS     = ['--text-invert-color'];

(function wireTextControls() {
  // Shared on-surface colour (two selects — light + dark)
  ['light', 'dark'].forEach(mode => {
    const sel = document.getElementById(`text-onsurface-select-${mode}`);
    if (!sel) return;
    sel.addEventListener('change', () => {
      const chosen = sel.value;
      if ((mode === 'dark') === isDark()) {
        TEXT_ON_SURFACE_VARS.forEach(v => liveTokenTarget().style.setProperty(v, `var(--${chosen})`));
        const preview = document.getElementById('text-onsurface-preview');
        if (preview) preview.style.background = `rgb(var(--${chosen}))`;
      }
      TEXT_ON_SURFACE_VARS.forEach(v => {
        const bareKey = v.replace(/^--/, '');
        if (mode === 'dark') dirtySemanticD.set(bareKey, chosen);
        else                 dirtySemanticL.set(bareKey, chosen);
      });
      // Mirror to opposite-mode invert: light dropdown → dark invert; dark dropdown → light invert
      TEXT_INVERT_VARS.forEach(v => {
        const bareKey = v.replace(/^--/, '');
        if (mode === 'dark') dirtySemanticL.set(bareKey, chosen);
        else                 dirtySemanticD.set(bareKey, chosen);
      });
      updateSaveBar();
    });
  });

  // Per-level alpha inputs — separate light and dark
  ['light', 'dark'].forEach(mode => {
    ['high', 'medium', 'low', 'disabled'].forEach(level => {
      new TokenInput(document.getElementById(`text-${mode}-alpha-${level}`), `--text-${level}-${mode}-alpha`);
    });
  });

  // Accent colour (two selects — light + dark)
  ['light', 'dark'].forEach(mode => {
    const sel = document.getElementById(`text-accent-select-${mode}`);
    if (!sel) return;
    sel.addEventListener('change', () => {
      const chosen = sel.value;
      if ((mode === 'dark') === isDark()) {
        liveTokenTarget().style.setProperty('--text-accent-color', `var(--${chosen})`);
        const preview = document.getElementById('text-accent-preview');
        if (preview) preview.style.background = `rgb(var(--${chosen}))`;
      }
      if (mode === 'dark') dirtySemanticD.set('text-accent-color', chosen);
      else                 dirtySemanticL.set('text-accent-color', chosen);
      // Mirror to opposite-mode invert-accent
      if (mode === 'dark') dirtySemanticL.set('text-invert-accent-color', chosen);
      else                 dirtySemanticD.set('text-invert-accent-color', chosen);
      updateSaveBar();
    });
  });

  // Accent alpha — high/medium/low for each mode
  ['light', 'dark'].forEach(mode => {
    ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
      new TokenInput(document.getElementById(`text-${mode}-alpha-${level}`), `--text-${level}-${mode}-alpha`);
    });
  });
})();

// ── Action overlay alpha controls ─────────────────────────────────────
(function wireActionOverlayAlpha() {
  ['hover', 'pressed'].forEach(level => {
    const inp = document.getElementById(`action-overlay-${level}-global-alpha`);
    const seeded = getCSSAlpha(`--action-overlay-${level}-global-alpha`);
    if (inp && seeded !== null) inp.value = String(seeded);
    new TokenInput(inp, `--action-overlay-${level}-global-alpha`, { precision: 1000 });
  });
})();

// ── Border swatch label updater ───────────────────────────────────────
// Module-level so the dark-mode toggle and store subscriber can both call it.
function updateBorderSwatchLabels() {
  const mode = isDark() ? 'dark' : 'light';
  const activeMap = isDark() ? (semanticConfig.dark || {}) : (semanticConfig.light || {});
  const colorStep = activeMap['--border-color'] || '';
  const focusStep = activeMap['--border-focus-color'] || '';
  const aHigh = getComputedStyle(document.documentElement).getPropertyValue(`--border-high-${mode}-alpha`).trim();
  const aMid  = getComputedStyle(document.documentElement).getPropertyValue(`--border-medium-${mode}-alpha`).trim();
  const aLow  = getComputedStyle(document.documentElement).getPropertyValue(`--border-low-${mode}-alpha`).trim();
  const aFoc  = getComputedStyle(document.documentElement).getPropertyValue('--border-focus-global-alpha').trim();
  const colorBase = colorStep ? `(${colorStep})` : '';
  const focusBase = focusStep ? `(${focusStep})` : '';
  const h = document.getElementById('border-meta-high');   if (h) h.innerHTML = `--border-color ${colorBase}<br>opacity high (${aHigh})`;
  const m = document.getElementById('border-meta-medium'); if (m) m.innerHTML = `--border-color ${colorBase}<br>opacity medium (${aMid})`;
  const l = document.getElementById('border-meta-low');    if (l) l.innerHTML = `--border-color ${colorBase}<br>opacity low (${aLow})`;
  const f = document.getElementById('border-meta-focus');  if (f) f.innerHTML = `--border-focus ${focusBase}<br>opacity focus (${aFoc})`;
}

// ── Border colour / alpha / width controls ────────────────────────────
(function wireBorderControls() {
  ['focus', 'base'].forEach(token => {
    const varName   = token === 'focus' ? '--border-focus-color' : '--border-color';
    const previewId = token === 'focus' ? 'border-focus-preview' : 'border-base-preview';
    ['light', 'dark'].forEach(mode => {
      const sel = document.getElementById(`border-${token}-select-${mode}`);
      if (!sel) return;
      sel.addEventListener('change', () => {
        const chosen = sel.value;
        if ((mode === 'dark') === isDark()) {
          liveTokenTarget().style.setProperty(varName, `var(--${chosen})`);
          const preview = document.getElementById(previewId);
          if (preview) preview.style.background = `rgb(var(--${chosen}))`;
        }
        const bareKey = varName.replace(/^--/, '');
        if (mode === 'dark') dirtySemanticD.set(bareKey, chosen);
        else                 dirtySemanticL.set(bareKey, chosen);
        rebuildAPCA();
        updateSaveBar();
      });
    });
  });

  ['high', 'medium', 'low'].forEach(level => {
    ['light', 'dark'].forEach(mode => {
      new TokenInput(
        document.getElementById(`border-${mode}-alpha-${level}`),
        `--border-${level}-${mode}-alpha`,
        { aliasVar: `--border-${level}-alpha`, aliasMode: mode }
      );
    });
  });

  updateBorderSwatchLabels();

  new TokenInput(document.getElementById('border-focus-global-alpha'), '--border-focus-global-alpha');

  ['border-global-width', 'border-focus-global-width'].forEach(varKey => {
    const inp = document.getElementById(varKey);
    if (!inp) return;
    function commitWidth() {
      const raw = inp.value.trim();
      if (!/^\d+(\.\d+)?(px|rem|em)$/.test(raw)) { inp.style.borderColor = 'rgb(var(--meaning-error))'; return; }
      inp.style.borderColor = '';
      document.documentElement.style.setProperty(`--${varKey}`, raw);
      dirtySemanticRaw.set(`--${varKey}`, raw);
      updateSaveBar();
    }
    inp.addEventListener('change', commitWidth);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commitWidth(); inp.blur(); }
      if (e.key === 'Escape') { inp.blur(); }
    });
  });
})();

// ── APCA contrast tables ──────────────────────────────────────────────
// Thin wrapper around the official apca-w3 library — keeps all call sites unchanged
function apcaLc(txt, bg) {
  return APCAcontrast(sRGBtoY([txt.r, txt.g, txt.b]), sRGBtoY([bg.r, bg.g, bg.b]));
}
function compositeRGB(fg, a, bg) {
  return {
    r: Math.round(a * fg.r + (1 - a) * bg.r),
    g: Math.round(a * fg.g + (1 - a) * bg.g),
    b: Math.round(a * fg.b + (1 - a) * bg.b),
  };
}
const resolveToRGBCache = new Map();
function resolveToRGB(expr) {
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
      const lc      = apcaLc(effective, surf.rgb);
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
  // Section label row
  html += '<tr>';
  html += `<th colspan="${nCols + 1}" class="pg-apca-section-label">${leftTitle}</th>`;
  html += '<th class="pg-apca-divider"></th>';
  html += `<th colspan="${nCols + 1}" class="pg-apca-section-label">${rightTitle}</th>`;
  html += '</tr>';
  // Column header row
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
    html += leftTokens[i]  ? renderCells(leftTokens[i],  colSurfaces) : emptyCells(colSurfaces);
    html += '<td class="pg-apca-divider"></td>';
    html += rightTokens[i] ? renderCells(rightTokens[i], colSurfaces) : emptyCells(colSurfaces);
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

function rebuildAPCA() {
  resolveToRGBCache.clear();
  const sAlpha  = getCSSAlpha('--surfaces-global-alpha') || 0.93;
  const baseRGB = resolveToRGB('rgb(var(--surfaces-base-color))');

  const surfaces = [
    { label: 'base',   rgb: baseRGB },
    { label: 'l1',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l1-color))'),  sAlpha, baseRGB) },
    { label: 'l2',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l2-color))'),  sAlpha, baseRGB) },
    { label: 'l2a',    rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l2a-color))'), sAlpha, baseRGB) },
    { label: 'l3',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l3-color))'),  sAlpha, baseRGB) },
    { label: 'l4',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l4-color))'),  sAlpha, baseRGB) },
    { label: 'l5',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l5-color))'),  sAlpha, baseRGB) },
  ];

  const aHigh = getCSSAlpha('--text-high-alpha')        || 1;
  const aMid  = getCSSAlpha('--text-medium-alpha')      || 0.87;
  const aLow  = getCSSAlpha('--text-low-alpha')         || 0.60;
  const aDis  = getCSSAlpha('--text-disabled-alpha')    || 0.38;

  const aAccHigh = getCSSAlpha('--text-accent-high-alpha')   || 0.85;
  const aAccMid  = getCSSAlpha('--text-accent-medium-alpha') || 0.60;
  const aAccLow  = getCSSAlpha('--text-accent-low-alpha')    || 0.38;

  const textColorRGB  = resolveToRGB('rgb(var(--text-color))');
  const accentRGB     = resolveToRGB('rgb(var(--text-accent-color))');
  const accentTokens = [
    { label: 'High (Lc>90 Fluent Text)',    rgb: accentRGB, alpha: aAccHigh },
    { label: 'Medium (Lc>75 Body Text)',    rgb: accentRGB, alpha: aAccMid  },
    { label: 'Low (Lc>60 Context Text)',    rgb: accentRGB, alpha: aAccLow  },
  ];
  const textTokens = [
    { label: 'High (Lc>90 Fluent Text)',    rgb: textColorRGB, alpha: aHigh },
    { label: 'Medium (Lc>75 Body Text)',    rgb: textColorRGB, alpha: aMid  },
    { label: 'Low (Lc>60 Context Text)',    rgb: textColorRGB, alpha: aLow  },
    { label: 'Disabled (Lc>30 Spot Text)', rgb: textColorRGB, alpha: aDis  },
  ];

  const aOverlayHover    = getCSSAlpha('--action-overlay-hover-global-alpha')   || 0.12;
  const aOverlayPressed  = getCSSAlpha('--action-overlay-pressed-global-alpha') || 0.22;
  const primaryDefaultRGB   = resolveToRGB('rgb(var(--action-primary-default-color))');
  const primaryOverlayRGB   = resolveToRGB('rgb(var(--action-primary-overlay-color))');
  const secondaryDefaultRGB = resolveToRGB('rgb(var(--action-secondary-default-color))');
  const secondaryOverlayRGB = resolveToRGB('rgb(var(--action-secondary-overlay-color))');
  const actionTokens = [
    { label: 'primary-default',         rgb: primaryDefaultRGB,  alpha: 1 },
    { label: 'primary-overlay (hover)',  rgb: compositeRGB(primaryOverlayRGB, aOverlayHover, primaryDefaultRGB),  alpha: 1 },
    { label: 'primary-overlay (pressed)',rgb: compositeRGB(primaryOverlayRGB, aOverlayPressed, primaryDefaultRGB), alpha: 1 },
    { label: 'secondary-disabled',      rgb: resolveToRGB('rgb(var(--action-secondary-disabled-color))'), alpha: 1 },
    { label: 'secondary-default',       rgb: secondaryDefaultRGB, alpha: 1 },
    { label: 'secondary-overlay (hover)',  rgb: compositeRGB(secondaryOverlayRGB, aOverlayHover, secondaryDefaultRGB),  alpha: 1 },
    { label: 'secondary-overlay (pressed)',rgb: compositeRGB(secondaryOverlayRGB, aOverlayPressed, secondaryDefaultRGB), alpha: 1 },
  ];

  const borderColor = resolveToRGB('rgb(var(--border-color))');
  const aBHigh = getCSSAlpha('--border-high-alpha')   || 0.87;
  const aBMid  = getCSSAlpha('--border-medium-alpha') || 0.38;
  const aBLow  = getCSSAlpha('--border-low-alpha')    || 0.12;
  const aBFoc  = getCSSAlpha('--border-focus-global-alpha')  || 1;
  const borderTokens = [
    { label: 'high',   rgb: borderColor,                                alpha: aBHigh },
    { label: 'medium', rgb: borderColor,                                alpha: aBMid  },
    { label: 'low',    rgb: borderColor,                                alpha: aBLow  },
    { label: 'focus',  rgb: resolveToRGB('rgb(var(--border-focus-color))'),   alpha: aBFoc  },
  ];

  buildDualAPCATable('apca-text-combined', accentTokens, textTokens,
    'Accent text tokens on surfaces', 'On-surface text tokens on surfaces', surfaces);
  buildAPCATable('apca-action-table', actionTokens, surfaces);
  buildAPCATable('apca-border-table', borderTokens, surfaces);
}

initSemanticSelects();
loadPalette();
connectSSE();

// ── Arrow-key nudge for alpha inputs ─────────────────────────────────
// Delegates to the registered TokenInput instance — no manual value parsing.
// Up/Down: ±0.01  |  Shift+Up/Down: ±0.1
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  const instance = inputRegistry.get(e.target);
  if (!instance) return;
  e.preventDefault();
  instance.nudge((e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? NUDGE_LARGE : NUDGE_SMALL));
});

// ── Divider emphasis dropdown ─────────────────────────────────────────
// Swaps the border-low/medium/high class on both demo elements and
// updates the comp-note labels to reflect the current composition.
(function initDividerEmphasis() {
  const sel    = document.getElementById('divider-emphasis-select');
  const demoH  = document.getElementById('pg-divider-h');
  const demoV  = document.getElementById('pg-divider-v');
  const noteH  = document.getElementById('pg-divider-h-note');
  const noteV  = document.getElementById('pg-divider-v-note');
  if (!sel || !demoH || !demoV) return;

  // EMPHASIS_LEVELS is defined at module scope

  sel.addEventListener('change', () => {
    const chosen = sel.value;
    EMPHASIS_LEVELS.forEach(cls => {
      demoH.classList.remove(cls);
      demoV.classList.remove(cls);
    });
    demoH.classList.add(chosen);
    demoV.classList.add(chosen);
    if (noteH) noteH.textContent = `<hr class="divider ${chosen}">`;
    if (noteV) noteV.textContent = `<div class="divider-vertical ${chosen}"></div>`;
  });
})();

/* =====================================================================
   TYPOGRAPHY CONTROLS
   Loaded Fonts · Font Roles · Letter Spacing · Type Scale
   ===================================================================== */

// ── Scale computation ─────────────────────────────────────────────────
const SCALE_RATIOS = {
  'minor-second':   1.067,
  'major-second':   1.125,
  'minor-third':    1.200,
  'major-third':    1.250,
  'perfect-fourth': 1.333,
};

function computeScale(ratio) {
  const snap  = v => Math.round(v / 1.5) * 1.5;
  const snap4 = v => Math.round(v / 4) * 4;
  const f = {}, fRaw = {}, lb = {}, lt = {}, ld = {};
  for (let n = 1; n <= 15; n++) {
    const raw = 9 * Math.pow(ratio, n - 1);
    fRaw[n] = parseFloat(raw.toFixed(2));
    f[n]    = snap(raw);
  }
  for (let n = 1; n <= 8;  n++) lb[n] = Math.max(snap4(f[n] * 1.5),  4);
  for (let n = 1; n <= 15; n++) lt[n] = Math.max(snap4(f[n] * 1.333), 4);
  for (let n = 6; n <= 15; n++) ld[n] = Math.max(snap4(f[n] * 1.25),  4);
  return { f, fRaw, lb, lt, ld };
}

const SCALE_TABLES = Object.fromEntries(
  Object.entries(SCALE_RATIOS).map(([k, r]) => [k, computeScale(r)])
);

// ── Loaded fonts state ────────────────────────────────────────────────
// Map<slug, { name, weights: Set<string>, italic: boolean, availableWeights: Set<string>|null, hasItalic: boolean|null }>
const loadedFonts = new Map();

// ── Discover available weights via Google Fonts CSS2 API ─────────────
async function discoverFontWeights(name) {
  try {
    const encoded = name.trim().replace(/ /g, '+');
    // Request all weights + italic — GF returns only @font-face blocks that actually exist
    const url = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const css = await res.text();
    if (!css.includes('@font-face')) return null; // font not on Google Fonts
    const weightSet = new Set();
    for (const m of css.matchAll(/font-weight:\s*(\d+)(?:\s+(\d+))?\s*;/g)) {
      if (m[2]) {
        // Variable font range e.g. "100 900"
        const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
        for (let w = lo; w <= hi; w += 100) weightSet.add(String(w));
      } else {
        weightSet.add(m[1]);
      }
    }
    const hasItalic = /font-style:\s*italic/.test(css);
    return { weights: weightSet, hasItalic };
  } catch {
    return null;
  }
}

function showFontError(msg) {
  const el = document.getElementById('pg-font-error');
  if (el) { el.textContent = msg; el.hidden = false; }
}
function clearFontError() {
  const el = document.getElementById('pg-font-error');
  if (el) { el.textContent = ''; el.hidden = true; }
}

// ── Current scale working copy ────────────────────────────────────────
// Flat object: { f1..f15, lb1..lb8, lt1..lt15, ld6..ld15 } — all numbers (px values without unit)
let currentScaleValues = {};

// ── Helpers ───────────────────────────────────────────────────────────
function fontSlug(name) { return name.trim().toLowerCase().replace(/\s+/g, '-'); }

function buildGFUrl(entry) {
  const sorted = [...entry.weights].map(Number).sort((a, b) => a - b);
  const encoded = entry.name.replace(/ /g, '+');
  if (entry.italic) {
    const regular = sorted.map(w => `0,${w}`).join(';');
    const italic  = sorted.map(w => `1,${w}`).join(';');
    return `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@${regular};${italic}&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${sorted.join(';')}&display=swap`;
}

function injectFontLink(slug, url) {
  let link = document.getElementById(`gf-${slug}`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id  = `gf-${slug}`;
    document.head.appendChild(link);
  }
  link.href = url;
}

function removeFontLink(slug) {
  const link = document.getElementById(`gf-${slug}`);
  if (link) link.remove();
}

// ── Font role select population ───────────────────────────────────────
function repopulateRoleSelects() {
  const opts = [...loadedFonts.values()]
    .map(e => `<option value="${e.name}">${e.name}</option>`)
    .join('');
  document.querySelectorAll('.pg-font-role-select').forEach(sel => {
    const current = sel.value;
    sel.innerHTML = opts || '<option value="">— no fonts loaded —</option>';
    if (current && [...loadedFonts.values()].some(e => e.name === current)) sel.value = current;
  });
}

// ── Render a loaded font entry row ────────────────────────────────────
const GF_WEIGHTS = ['100','200','300','400','500','600','700','800','900'];

function renderFontEntry(entry) {
  const slug = fontSlug(entry.name);
  const weightBoxes = GF_WEIGHTS.map(w => {
    const checked    = entry.weights.has(w) ? ' checked' : '';
    // availableWeights is null when loaded from a save (unknown) — treat as available
    const available  = !entry.availableWeights || entry.availableWeights.has(w);
    const disabledAttr  = available ? '' : ' disabled';
    const unavailClass  = available ? '' : ' pg-fw-unavail';
    const titleAttr     = available ? '' : ' title="Not available for this font"';
    return `<label class="pg-fw-label${unavailClass}"${titleAttr}>` +
      `<input type="checkbox" class="pg-fw-cb" data-slug="${slug}" data-weight="${w}"${checked}${disabledAttr}> ${w}` +
    `</label>`;
  }).join('');
  const italicChecked  = entry.italic ? ' checked' : '';
  // hasItalic null = unknown (old saves) → show as available
  const italicAvail    = entry.hasItalic == null || entry.hasItalic;
  const italicDisabled = italicAvail ? '' : ' disabled';
  const italicClass    = italicAvail ? '' : ' pg-fw-unavail';
  const italicTitle    = italicAvail ? '' : ' title="No italic variant for this font"';
  return `<div class="pg-font-entry" id="pg-font-entry-${slug}">
    <div class="pg-font-entry-header">
      <span class="pg-font-entry-name">${entry.name}</span>
      <button class="pg-font-remove-btn" data-slug="${slug}" title="Remove">&times;</button>
    </div>
    <div class="pg-fw-row">
      ${weightBoxes}
      <label class="pg-fw-label pg-fw-italic-label${italicClass}"${italicTitle}><input type="checkbox" class="pg-fw-italic-cb" data-slug="${slug}"${italicChecked}${italicDisabled}> italic</label>
    </div>
  </div>`;
}

function refreshFontList() {
  const list = document.getElementById('pg-loaded-fonts-list');
  if (!list) return;
  list.innerHTML = [...loadedFonts.values()].map(renderFontEntry).join('');
}

// ── Add font ──────────────────────────────────────────────────────────
async function addFont(rawName) {
  const name = rawName.trim();
  if (!name) return false;
  const slug = fontSlug(name);
  if (loadedFonts.has(slug)) return false;

  // Show loading state
  const btn = document.getElementById('pg-font-add-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }
  clearFontError();

  const result = await discoverFontWeights(name);

  if (btn) { btn.disabled = false; btn.textContent = '+ Add Font'; }

  if (!result || result.weights.size === 0) {
    showFontError(`"${name}" was not found on Google Fonts. Check spelling or browse to find the exact name.`);
    return false;
  }

  // Default selection: 400 + 700 if available; otherwise pick the two most central weights
  const avail = [...result.weights].map(Number).sort((a, b) => a - b);
  const defaultWeights = new Set();
  if (result.weights.has('400')) defaultWeights.add('400');
  if (result.weights.has('700')) defaultWeights.add('700');
  if (defaultWeights.size === 0) {
    defaultWeights.add(String(avail[Math.floor((avail.length - 1) / 2)]));
  }

  const entry = {
    name,
    weights:          defaultWeights,
    italic:           result.hasItalic,
    availableWeights: result.weights,
    hasItalic:        result.hasItalic,
  };
  loadedFonts.set(slug, entry);
  injectFontLink(slug, buildGFUrl(entry));
  refreshFontList();
  repopulateRoleSelects();
  return true;
}

// ── Loaded fonts area events ──────────────────────────────────────────
document.getElementById('pg-font-add-btn')?.addEventListener('click', async () => {
  const inp = document.getElementById('pg-font-name-input');
  if (!inp) return;
  const ok = await addFont(inp.value);
  if (ok) inp.value = '';
  inp.focus();
});

document.getElementById('pg-font-name-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('pg-font-add-btn')?.click(); }
});

// Update the "Browse" link href as the user types
document.getElementById('pg-font-name-input')?.addEventListener('input', e => {
  const link = document.getElementById('pg-font-browse-link');
  if (!link) return;
  const q = e.target.value.trim();
  link.href = q
    ? `https://fonts.google.com/?query=${encodeURIComponent(q)}`
    : 'https://fonts.google.com/';
});

document.getElementById('pg-loaded-fonts-list')?.addEventListener('change', e => {
  if (e.target.matches('.pg-fw-cb')) {
    const { slug, weight } = e.target.dataset;
    const entry = loadedFonts.get(slug);
    if (!entry) return;
    if (e.target.checked) entry.weights.add(weight);
    else entry.weights.delete(weight);
    injectFontLink(slug, buildGFUrl(entry));
  } else if (e.target.matches('.pg-fw-italic-cb')) {
    const { slug } = e.target.dataset;
    const entry = loadedFonts.get(slug);
    if (!entry) return;
    entry.italic = e.target.checked;
    injectFontLink(slug, buildGFUrl(entry));
  }
});

document.getElementById('pg-loaded-fonts-list')?.addEventListener('click', e => {
  if (!e.target.matches('.pg-font-remove-btn')) return;
  const { slug } = e.target.dataset;
  loadedFonts.delete(slug);
  removeFontLink(slug);
  document.getElementById(`pg-font-entry-${slug}`)?.remove();
  repopulateRoleSelects();
});

// ── Font role selects ─────────────────────────────────────────────────
document.querySelectorAll('.pg-font-role-select').forEach(sel => {
  sel.addEventListener('change', () => {
    const cssVar = sel.dataset.var;
    const name   = sel.value;
    if (!name) return;
    const value = `'${name}', system-ui, sans-serif`;
    dirtyFonts.set(cssVar, value);
    store.set(cssVar, value);
  });
});

// ── Font weight selects ───────────────────────────────────────────────
document.querySelectorAll('.pg-font-weight-select').forEach(sel => {
  sel.addEventListener('change', () => {
    const cssVar = sel.dataset.var;
    const value  = sel.value;
    dirtyFonts.set(cssVar, value);
    store.set(cssVar, value);
  });
});

// ── Letter-spacing inputs ─────────────────────────────────────────────
document.querySelectorAll('.pg-ls-input').forEach(inp => {
  function commitLS() {
    const pct = parseFloat(inp.value);
    if (isNaN(pct)) return;
    const em   = Math.round(pct / 100 * 10000) / 10000;
    const base = parseFloat(inp.dataset.base) || 16;
    const px   = Math.round(pct / 100 * base * 10) / 10;
    const pxLabel = document.getElementById(inp.id + '-px');
    if (pxLabel) pxLabel.textContent = `\u2248${px}px at ${base}px`;
    const emStr = `${em}em`;
    dirtyFonts.set(inp.dataset.var, emStr);
    store.set(inp.dataset.var, emStr);
  }
  inp.addEventListener('change', commitLS);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commitLS(); inp.blur(); }
    if (e.key === 'Escape') { inp.blur(); }
  });
});

// ── Scale grid ────────────────────────────────────────────────────────
function applyScaleValues(table) {
  for (let n = 1; n <= 15; n++) {
    document.documentElement.style.setProperty(`--font-size-f${n}`,     `${table.f[n]}px`);
    document.documentElement.style.setProperty(`--line-height-lt${n}`,  `${table.lt[n]}px`);
  }
  for (let n = 1; n <= 8;  n++) document.documentElement.style.setProperty(`--line-height-lb${n}`, `${table.lb[n]}px`);
  for (let n = 6; n <= 15; n++) document.documentElement.style.setProperty(`--line-height-ld${n}`, `${table.ld[n]}px`);
}

function renderScaleGrid(table) {
  const tbody = document.getElementById('pg-scale-tbody');
  if (!tbody) return;
  let html = '';
  for (let n = 1; n <= 15; n++) {
    const haslb = n <= 8;
    const hasld = n >= 6;
    html += `<tr>
      <td class="pg-scale-td pg-scale-step">f${n}</td>
      <td class="pg-scale-td pg-scale-raw">${table.fRaw[n]}</td>
      <td class="pg-scale-td"><input type="number" class="pg-scale-input" data-key="f${n}"  data-cssvar="--font-size-f${n}"    value="${table.f[n]}"  step="0.5" min="1"></td>
      <td class="pg-scale-td">${haslb ? `<input type="number" class="pg-scale-input" data-key="lb${n}" data-cssvar="--line-height-lb${n}" value="${table.lb[n]}" step="1" min="1">` : ''}</td>
      <td class="pg-scale-td"><input type="number" class="pg-scale-input" data-key="lt${n}" data-cssvar="--line-height-lt${n}" value="${table.lt[n]}" step="1" min="1"></td>
      <td class="pg-scale-td">${hasld ? `<input type="number" class="pg-scale-input" data-key="ld${n}" data-cssvar="--line-height-ld${n}" value="${table.ld[n]}" step="1" min="1">` : ''}</td>
    </tr>`;
  }
  tbody.innerHTML = html;
  wireScaleGridInputs();
}

function wireScaleGridInputs() {
  document.querySelectorAll('.pg-scale-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const val = parseFloat(inp.value);
      if (isNaN(val) || val <= 0) return;
      inp.classList.add('pg-scale-dirty');
      document.documentElement.style.setProperty(inp.dataset.cssvar, `${val}px`);
      currentScaleValues[inp.dataset.key] = val;
      dirtyScale = true;
      updateSaveBar();
    });
  });
}

// ── Scale preset select ───────────────────────────────────────────────
document.getElementById('pg-scale-select')?.addEventListener('change', e => {
  const key   = e.target.value;
  const table = SCALE_TABLES[key];
  if (!table) return;
  // Flatten into currentScaleValues
  for (let n = 1; n <= 15; n++) { currentScaleValues[`f${n}`]  = table.f[n];  currentScaleValues[`lt${n}`] = table.lt[n]; }
  for (let n = 1; n <= 8;  n++) { currentScaleValues[`lb${n}`] = table.lb[n]; }
  for (let n = 6; n <= 15; n++) { currentScaleValues[`ld${n}`] = table.ld[n]; }
  applyScaleValues(table);
  renderScaleGrid(table);
  dirtyScale = true;
  updateSaveBar();
});

// ── Init typography controls ──────────────────────────────────────────
(function initTypographyControls() {
  const cs = getComputedStyle(document.documentElement);

  // Seed font-weight selects from computed styles
  document.querySelectorAll('.pg-font-weight-select').forEach(sel => {
    const raw = cs.getPropertyValue(sel.dataset.var).trim();
    if (raw && sel.querySelector(`option[value="${raw}"]`)) sel.value = raw;
  });

  // Seed letter-spacing inputs from computed styles
  document.querySelectorAll('.pg-ls-input').forEach(inp => {
    const raw  = cs.getPropertyValue(inp.dataset.var).trim();
    const base = parseFloat(inp.dataset.base) || 16;
    if (raw && raw !== '0em' && raw !== '0') {
      const emVal = parseFloat(raw);
      if (!isNaN(emVal)) {
        inp.value = String(Math.round(emVal * 100 * 10) / 10);
        const pxLabel = document.getElementById(inp.id + '-px');
        if (pxLabel) pxLabel.textContent = `\u2248${Math.round(emVal * base * 10) / 10}px at ${base}px`;
      }
    }
  });

  // Seed scale grid with current theme values (Minor Third default)
  const defaultTable = SCALE_TABLES['minor-third'];
  for (let n = 1; n <= 15; n++) { currentScaleValues[`f${n}`]  = defaultTable.f[n];  currentScaleValues[`lt${n}`] = defaultTable.lt[n]; }
  for (let n = 1; n <= 8;  n++) { currentScaleValues[`lb${n}`] = defaultTable.lb[n]; }
  for (let n = 6; n <= 15; n++) { currentScaleValues[`ld${n}`] = defaultTable.ld[n]; }
  renderScaleGrid(defaultTable);
})();
