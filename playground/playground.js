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

function rebuildPaletteOpts() {
  const byPrefix = (pfx) =>
    Object.keys(localPalette)
      .filter(k => k.startsWith(pfx) && /^\d+$/.test(k.slice(pfx.length)))
      .sort((a, b) => numSuffix(a) - numSuffix(b));
  PALETTE_OPTS = [
    { group: 'Primary',   vars: byPrefix('p') },
    { group: 'Secondary', vars: byPrefix('s') },
    { group: 'Neutral',   vars: byPrefix('n') },
    { group: 'Meaning',   vars: [...byPrefix('r'), ...byPrefix('y'), ...byPrefix('g')] },
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

function renderGroup(containerId, prefix) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const keys = Object.keys(localPalette)
    .filter(k => k.startsWith(prefix) && /^\d+$/.test(k.slice(prefix.length)))
    .sort((a, b) => numSuffix(a) - numSuffix(b));
  el.innerHTML = keys.map(k => makeSwatch(k, localPalette[k])).join('') + makeAddTile(prefix);
}

function renderMeaningGroup() {
  const el = document.getElementById('palette-meaning');
  if (!el) return;
  const byP = (pfx) => Object.keys(localPalette)
    .filter(k => k.startsWith(pfx) && /^\d+$/.test(k.slice(pfx.length)))
    .sort((a, b) => numSuffix(a) - numSuffix(b));
  const keys = [...byP('r'), ...byP('y'), ...byP('g')];
  el.innerHTML = keys.map(k => makeSwatch(k, localPalette[k])).join('') + makeAddTile('meaning');
}

function refreshPaletteUI() { rebuildPaletteOpts(); initDropdowns(); }

function renderPaletteGroups() {
  renderGroup('palette-p', 'p');
  renderGroup('palette-s', 's');
  renderGroup('palette-n', 'n');
  renderMeaningGroup();
  refreshPaletteUI();
}

// ── Dirty state ──────────────────────────────────────────────────────
const dirtyPalette   = new Map(); // patch-mode only: varName → rgb
const dirtySemanticL = new Map();
const dirtySemanticD = new Map();
const dirtySemanticRaw = new Map(); // raw non-var values e.g. --surfaces-alpha

// ── Cached save-bar elements (queried once at load) ────────────────────
const _statusEl   = document.getElementById('save-status');
const _saveBtn    = document.getElementById('save-btn');
const _discardBtn = document.getElementById('discard-btn');

function updateSaveBar() {
  const palCount = paletteMode === 'full' ? 1 : dirtyPalette.size;
  const total    = palCount + dirtySemanticL.size + dirtySemanticD.size + dirtySemanticRaw.size;
  if (total === 0) {
    _statusEl.className   = 'pg-save-status';
    _statusEl.textContent = 'No unsaved changes';
    _saveBtn.disabled     = true;
    _discardBtn.disabled  = true;
  } else {
    _statusEl.className   = 'pg-save-status has-changes';
    _statusEl.textContent = `${total} unsaved change${total > 1 ? 's' : ''}`;
    _saveBtn.disabled     = false;
    _discardBtn.disabled  = false;
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
let _apcaTimer;
store.subscribe(() => { clearTimeout(_apcaTimer); _apcaTimer = setTimeout(rebuildAPCA, 40); });
store.subscribe(() => updateSaveBar());
store.subscribe(cssVar => { if (cssVar.startsWith('--border')) updateBorderSwatchLabels(); });

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
    const alpha = semanticConfig.rawValues && semanticConfig.rawValues['--surfaces-alpha'];
    if (alpha) {
      const inp = document.getElementById('surfaces-alpha-input');
      if (inp) inp.value = alpha;
    }
    ['l1', 'l2', 'l3', 'l4', 'l5'].forEach(level => {
      const v = semanticConfig.rawValues && semanticConfig.rawValues[`--surfaces-blur-${level}`];
      if (v) { const i = document.getElementById(`surfaces-blur-${level}`); if (i) i.value = v; }
    });
    // Seed shadow colour dropdown
    const shadowColor = semanticConfig.light && semanticConfig.light['--shadow-color'];
    if (shadowColor) {
      const sel = document.getElementById('shadow-color-select');
      if (sel) sel.innerHTML = buildSelectOptions(shadowColor);
    }
    ['umbra', 'penumbra', 'ambient'].forEach(layer => {
      const v = semanticConfig.rawValues && semanticConfig.rawValues[`--shadow-alpha-${layer}`];
      if (v) { const i = document.getElementById(`shadow-alpha-${layer}`); if (i) i.value = v; }
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
      if (inp && raw[`--text-${mode}-alpha-${level}`] !== undefined) inp.value = raw[`--text-${mode}-alpha-${level}`];
    });
  });

  const acSelL = document.getElementById('text-accent-select-light');
  const acSelD = document.getElementById('text-accent-select-dark');
  if (acSelL) acSelL.innerHTML = buildSelectOptions(lightMap['--text-accent'] || '');
  if (acSelD) acSelD.innerHTML = buildSelectOptions(darkMap['--text-accent']  || '');

  const acPreview = document.getElementById('text-accent-preview');
  if (acPreview) acPreview.style.background = 'rgb(var(--text-accent))';

  // Seed accent alpha inputs
  ['light', 'dark'].forEach(mode => {
    ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
      const inp = document.getElementById(`text-${mode}-alpha-${level}`);
      if (inp && raw[`--text-${mode}-alpha-${level}`] !== undefined) inp.value = raw[`--text-${mode}-alpha-${level}`];
    });
  });

  // ── Token meta labels — show resolved palette step ──────────────────
  const activeMap = isDark() ? darkMap : lightMap;
  const colorStep  = activeMap['--text-color']  || '';
  const modeKey    = isDark() ? 'dark' : 'light';
  ['high', 'medium', 'low', 'disabled'].forEach(level => {
    const el = document.getElementById(`meta-text-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${modeKey}-alpha-${level}`]
               || raw[`--text-alpha-${level}`]
               || (level === 'high' ? '1' : level === 'medium' ? '0.87' : level === 'low' ? '0.60' : '0.38');
    const base = colorStep ? `(${colorStep})` : '';
    el.innerHTML = `--text-color ${base}<br>opacity ${level} (${alpha})`;
  });
  const accentStep = activeMap['--text-accent'] || '';
  const accentBase  = accentStep ? `--text-accent (${accentStep})` : '--text-accent';
  ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
    const el = document.getElementById(`meta-text-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${modeKey}-alpha-${level}`] || raw[`--text-alpha-${level}`] || '1';
    el.innerHTML = `${accentBase}<br>opacity ${level} (${alpha})`;
  });

  // ── Invert token meta labels ────────────────────────────────────────
  const invertColorStep = activeMap['--text-invert-color'] || '';
  ['high', 'medium', 'low', 'disabled'].forEach(level => {
    const el = document.getElementById(`meta-text-invert-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${modeKey}-alpha-${level}`]
               || raw[`--text-alpha-${level}`]
               || (level === 'high' ? '1' : level === 'medium' ? '0.87' : level === 'low' ? '0.60' : '0.38');
    const base = invertColorStep ? `(${invertColorStep})` : '';
    el.innerHTML = `--text-invert-color ${base}<br>opacity ${level} (${alpha})`;
  });
  const invertAccentEl   = document.getElementById('meta-text-invert-accent');
  const invertAccentStep = activeMap['--text-invert-accent'] || '';
  const invertAccentBase = `--text-invert-accent${invertAccentStep ? ` (${invertAccentStep})` : ''}`;
  const invertAccentAlpha = raw[`--text-${modeKey}-alpha-accent`] || raw['--text-alpha-accent'] || '1';
  if (invertAccentEl) invertAccentEl.innerHTML = `${invertAccentBase}<br>opacity accent (${invertAccentAlpha})`;
  ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
    const el = document.getElementById(`meta-text-invert-${level}`);
    if (!el) return;
    const alpha = raw[`--text-${modeKey}-alpha-${level}`] || raw[`--text-alpha-${level}`] || '1';
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
  if (focSelL)  focSelL.innerHTML  = buildSelectOptions(lightMap['--border-focus']  || '');
  if (focSelD)  focSelD.innerHTML  = buildSelectOptions(darkMap['--border-focus']   || '');
  if (baseSelL) baseSelL.innerHTML = buildSelectOptions(lightMap['--border-color']  || '');
  if (baseSelD) baseSelD.innerHTML = buildSelectOptions(darkMap['--border-color']   || '');

  const focPreview  = document.getElementById('border-focus-preview');
  const basePreview = document.getElementById('border-base-preview');
  if (focPreview)  { const s = (isDark() ? focSelD  : focSelL)?.value;  if (s) focPreview.style.background  = `rgb(var(--${s}))`;  }
  if (basePreview) { const s = (isDark() ? baseSelD : baseSelL)?.value; if (s) basePreview.style.background = `rgb(var(--${s}))`; }

  ['high', 'medium', 'low'].forEach(level => {
    ['light', 'dark'].forEach(mode => {
      const inp = document.getElementById(`border-${mode}-alpha-${level}`);
      if (inp && raw[`--border-${mode}-alpha-${level}`] !== undefined) inp.value = raw[`--border-${mode}-alpha-${level}`];
    });
  });
  const focAlpha = document.getElementById('border-alpha-focus');
  if (focAlpha && raw['--border-alpha-focus'] !== undefined) focAlpha.value = raw['--border-alpha-focus'];
  ['high', 'medium', 'low', 'focus'].forEach(level => {
    const inp = document.getElementById(`border-width-${level}`);
    if (inp && raw[`--border-width-${level}`] !== undefined) inp.value = raw[`--border-width-${level}`];
  });
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
  if (prefix === 'r' || prefix === 'y' || prefix === 'g') { renderMeaningGroup(); }
  else if (prefix === 'p') { renderGroup('palette-p', 'p'); }
  else if (prefix === 's') { renderGroup('palette-s', 's'); }
  else if (prefix === 'n') { renderGroup('palette-n', 'n'); }
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
  if (prefix === 'r' || prefix === 'y' || prefix === 'g') { renderMeaningGroup(); }
  else if (prefix === 'p') { renderGroup('palette-p', 'p'); }
  else if (prefix === 's') { renderGroup('palette-s', 's'); }
  else if (prefix === 'n') { renderGroup('palette-n', 'n'); }
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
        document.documentElement.style.setProperty(varName, `var(--${chosen})`);
      }
      const bareKey = varName.replace(/^--/, '');
      if (mode === 'dark') {
        dirtySemanticD.set(bareKey, chosen);
      } else {
        dirtySemanticL.set(bareKey, chosen);
      }
      markDirty(swatch);
      rebuildAPCA();
      updateSaveBar();
    });
  });
}

// ── Save ──────────────────────────────────────────────────────────────
async function save() {
  _statusEl.className   = 'pg-save-status building';
  _statusEl.textContent = 'Building…';
  _saveBtn.disabled     = true;

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
  };

  try {
    const r = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    _statusEl.className   = 'pg-save-status building';
    _statusEl.textContent = 'Building…';
  } catch (e) {
    _statusEl.className   = 'pg-save-status error';
    _statusEl.textContent = 'Error: ' + e.message;
    _saveBtn.disabled     = false;
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
      paletteMode = 'patch';
      clearAllDirty();
      _statusEl.className   = 'pg-save-status saved';
      _statusEl.textContent = 'Saved — reloading…';
      setTimeout(() => {
        localStorage.setItem('pg-dark', isDark() ? '1' : '0');
        sessionStorage.setItem('pg-scroll', window.scrollY);
        window.location.reload();
      }, 400);
    }
    if (e.data === 'rebuild-error') {
      _statusEl.className   = 'pg-save-status error';
      _statusEl.textContent = 'Build error — check terminal';
      _saveBtn.disabled = false;
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
    new TokenInput(document.getElementById(`shadow-alpha-${layer}`), `--shadow-alpha-${layer}`);
  });
})();

// ── Surfaces blur inputs (per level) ────────────────────────────────
['l1', 'l2', 'l3', 'l4', 'l5'].forEach(level => {
  const inp = document.getElementById(`surfaces-blur-${level}`);
  if (!inp) return;
  function commitBlur() {
    const raw = inp.value.trim();
    if (!/^\d+(\.\d+)?(px|rem|em)$/.test(raw)) { inp.style.borderColor = 'rgb(var(--meaning-error))'; return; }
    inp.style.borderColor = '';
    document.documentElement.style.setProperty(`--surfaces-blur-${level}`, raw);
    dirtySemanticRaw.set(`--surfaces-blur-${level}`, raw);
    updateSaveBar();
  }
  inp.addEventListener('change', commitBlur);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commitBlur(); inp.blur(); }
    if (e.key === 'Escape') { inp.blur(); }
  });
});

// ── Surfaces alpha input ─────────────────────────────────────────────
new TokenInput(document.getElementById('surfaces-alpha-input'), '--surfaces-alpha');

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
        TEXT_ON_SURFACE_VARS.forEach(v => document.documentElement.style.setProperty(v, `var(--${chosen})`));
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
      new TokenInput(document.getElementById(`text-${mode}-alpha-${level}`), `--text-${mode}-alpha-${level}`);
    });
  });

  // Accent colour (two selects — light + dark)
  ['light', 'dark'].forEach(mode => {
    const sel = document.getElementById(`text-accent-select-${mode}`);
    if (!sel) return;
    sel.addEventListener('change', () => {
      const chosen = sel.value;
      if ((mode === 'dark') === isDark()) {
        document.documentElement.style.setProperty('--text-accent', `var(--${chosen})`);
        const preview = document.getElementById('text-accent-preview');
        if (preview) preview.style.background = `rgb(var(--${chosen}))`;
      }
      if (mode === 'dark') dirtySemanticD.set('text-accent', chosen);
      else                 dirtySemanticL.set('text-accent', chosen);
      // Mirror to opposite-mode invert-accent
      if (mode === 'dark') dirtySemanticL.set('text-invert-accent', chosen);
      else                 dirtySemanticD.set('text-invert-accent', chosen);
      updateSaveBar();
    });
  });

  // Accent alpha — high/medium/low for each mode
  ['light', 'dark'].forEach(mode => {
    ['accent-high', 'accent-medium', 'accent-low'].forEach(level => {
      new TokenInput(document.getElementById(`text-${mode}-alpha-${level}`), `--text-${mode}-alpha-${level}`);
    });
  });
})();

// ── Action overlay alpha controls ─────────────────────────────────────
(function wireActionOverlayAlpha() {
  ['hover', 'pressed'].forEach(level => {
    const inp = document.getElementById(`action-overlay-alpha-${level}`);
    const seeded = getCSSAlpha(`--action-overlay-alpha-${level}`);
    if (inp && seeded !== null) inp.value = String(seeded);
    new TokenInput(inp, `--action-overlay-alpha-${level}`, { precision: 1000 });
  });
})();

// ── Border swatch label updater ───────────────────────────────────────
// Module-level so the dark-mode toggle and store subscriber can both call it.
function updateBorderSwatchLabels() {
  const mode = isDark() ? 'dark' : 'light';
  const activeMap = isDark() ? (semanticConfig.dark || {}) : (semanticConfig.light || {});
  const colorStep = activeMap['--border-color'] || '';
  const focusStep = activeMap['--border-focus'] || '';
  const aHigh = getComputedStyle(document.documentElement).getPropertyValue(`--border-${mode}-alpha-high`).trim();
  const aMid  = getComputedStyle(document.documentElement).getPropertyValue(`--border-${mode}-alpha-medium`).trim();
  const aLow  = getComputedStyle(document.documentElement).getPropertyValue(`--border-${mode}-alpha-low`).trim();
  const aFoc  = getComputedStyle(document.documentElement).getPropertyValue('--border-alpha-focus').trim();
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
    const varName   = token === 'focus' ? '--border-focus' : '--border-color';
    const previewId = token === 'focus' ? 'border-focus-preview' : 'border-base-preview';
    ['light', 'dark'].forEach(mode => {
      const sel = document.getElementById(`border-${token}-select-${mode}`);
      if (!sel) return;
      sel.addEventListener('change', () => {
        const chosen = sel.value;
        if ((mode === 'dark') === isDark()) {
          document.documentElement.style.setProperty(varName, `var(--${chosen})`);
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
        `--border-${mode}-alpha-${level}`,
        { aliasVar: `--border-alpha-${level}`, aliasMode: mode }
      );
    });
  });

  updateBorderSwatchLabels();

  new TokenInput(document.getElementById('border-alpha-focus'), '--border-alpha-focus');

  ['border-width', 'border-width-focus'].forEach(varKey => {
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
function resolveToRGB(expr) {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;';
  el.style.color = expr;
  document.body.appendChild(el);
  const c = window.getComputedStyle(el).color;
  el.remove();
  const m = c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : { r: 0, g: 0, b: 0 };
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
  const sAlpha  = getCSSAlpha('--surfaces-alpha') || 0.93;
  const baseRGB = resolveToRGB('rgb(var(--surfaces-base))');

  const surfaces = [
    { label: 'base',   rgb: baseRGB },
    { label: 'l1',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l1))'),  sAlpha, baseRGB) },
    { label: 'l2',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l2))'),  sAlpha, baseRGB) },
    { label: 'l2a',    rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l2a))'), sAlpha, baseRGB) },
    { label: 'l3',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l3))'),  sAlpha, baseRGB) },
    { label: 'l4',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l4))'),  sAlpha, baseRGB) },
    { label: 'l5',     rgb: compositeRGB(resolveToRGB('rgb(var(--surfaces-l5))'),  sAlpha, baseRGB) },
  ];

  const _am    = isDark() ? 'dark' : 'light';
  const aHigh = getCSSAlpha(`--text-${_am}-alpha-high`)     || 1;
  const aMid  = getCSSAlpha(`--text-${_am}-alpha-medium`)   || 0.87;
  const aLow  = getCSSAlpha(`--text-${_am}-alpha-low`)      || 0.60;
  const aDis  = getCSSAlpha(`--text-${_am}-alpha-disabled`) || 0.38;

  const aAccHigh = getCSSAlpha(`--text-${_am}-alpha-accent-high`)   || 0.85;
  const aAccMid  = getCSSAlpha(`--text-${_am}-alpha-accent-medium`) || 0.60;
  const aAccLow  = getCSSAlpha(`--text-${_am}-alpha-accent-low`)    || 0.38;

  const textColorRGB  = resolveToRGB('rgb(var(--text-color))');
  const accentRGB     = resolveToRGB('rgb(var(--text-accent))');
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

  const aOverlayHover    = getCSSAlpha('--action-overlay-alpha-hover')   || 0.12;
  const aOverlayPressed  = getCSSAlpha('--action-overlay-alpha-pressed') || 0.22;
  const primaryDefaultRGB  = resolveToRGB('rgb(var(--action-primary-default))');
  const primaryOverlayRGB  = resolveToRGB('rgb(var(--action-primary-overlay))');
  const secondaryDefaultRGB = resolveToRGB('rgb(var(--action-secondary-default))');
  const secondaryOverlayRGB = resolveToRGB('rgb(var(--action-secondary-overlay))');
  const actionTokens = [
    { label: 'primary-default',         rgb: primaryDefaultRGB,  alpha: 1 },
    { label: 'primary-overlay (hover)',  rgb: compositeRGB(primaryOverlayRGB, aOverlayHover, primaryDefaultRGB),  alpha: 1 },
    { label: 'primary-overlay (pressed)',rgb: compositeRGB(primaryOverlayRGB, aOverlayPressed, primaryDefaultRGB), alpha: 1 },
    { label: 'secondary-disabled',      rgb: resolveToRGB('rgb(var(--action-secondary-disabled))'), alpha: 1 },
    { label: 'secondary-default',       rgb: secondaryDefaultRGB, alpha: 1 },
    { label: 'secondary-overlay (hover)',  rgb: compositeRGB(secondaryOverlayRGB, aOverlayHover, secondaryDefaultRGB),  alpha: 1 },
    { label: 'secondary-overlay (pressed)',rgb: compositeRGB(secondaryOverlayRGB, aOverlayPressed, secondaryDefaultRGB), alpha: 1 },
  ];

  const borderColor = resolveToRGB('rgb(var(--border-color))');
  const aBHigh = getCSSAlpha('--border-alpha-high')   || 0.87;
  const aBMid  = getCSSAlpha('--border-alpha-medium') || 0.38;
  const aBLow  = getCSSAlpha('--border-alpha-low')    || 0.12;
  const aBFoc  = getCSSAlpha('--border-alpha-focus')  || 1;
  const borderTokens = [
    { label: 'high',   rgb: borderColor,                                alpha: aBHigh },
    { label: 'medium', rgb: borderColor,                                alpha: aBMid  },
    { label: 'low',    rgb: borderColor,                                alpha: aBLow  },
    { label: 'focus',  rgb: resolveToRGB('rgb(var(--border-focus))'),   alpha: aBFoc  },
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
  instance.nudge((e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 0.1 : 0.01));
});
