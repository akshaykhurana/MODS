// ============================================================
// MODS Playground Dev Server
// Zero dependencies — Node built-ins only.
// Usage: node server.js  (or npm run dev)
// Serves on http://localhost:3001
// ============================================================

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT     = 3001;
const ROOT     = __dirname;
// All raw, user-editable tokens live in _base.css after the consolidation.
// The aliases below preserve readability at call sites — every alias points
// to the same file. _semantic-tokens.css is the only other file the server
// writes to (alias re-pointings only).
const BASE_CSS = path.join(ROOT, 'src', '_base.css');
const PALETTE  = BASE_CSS;
const BASE_VARS = BASE_CSS;
const FONTS_CSS = BASE_CSS;
const THEME_CSS = BASE_CSS;
const SEMANTIC  = path.join(ROOT, 'src', '_semantic-tokens.css');
const DIST_CSS  = path.join(ROOT, 'dist', 'style.css');

// SSE clients
const clients = new Set();

function broadcast(event) {
  for (const res of clients) {
    res.write(`data: ${event}\n\n`);
  }
}

// Watch dist/style.css for external rebuilds (e.g. npm run build:css in another terminal)
// distMtime is updated inside the exec callback so when fs.watch fires afterwards
// the mtime matches and no duplicate broadcast is sent.
let distMtime    = fs.existsSync(DIST_CSS) ? fs.statSync(DIST_CSS).mtimeMs : 0;
let buildInFlight = false; // guard against concurrent /save builds
fs.watch(path.join(ROOT, 'dist'), (_, filename) => {
  if (filename === 'style.css') {
    const mtime = fs.existsSync(DIST_CSS) ? fs.statSync(DIST_CSS).mtimeMs : 0;
    if (mtime !== distMtime) {
      distMtime = mtime;
      broadcast('rebuild-done');
    }
  }
});

// ---- Config endpoint — parse current semantic token mappings ----
// Returns { light: { "--brand-main": "p50", ... }, dark: { "--brand-main": "p30", ... } }
// For Variables Naming Pattern tokens, alias chains are resolved to their leaf palette step
// so dropdowns get the actual palette step — e.g. --text-color → text-light-color → s10.
function parseSemanticConfig() {
  const content = fs.readFileSync(SEMANTIC, 'utf8');
  // Match the actual selector line (starts at beginning of line), not comments
  const darkMatch = content.match(/^\.dark\s*\{/m);
  const darkIdx = darkMatch ? darkMatch.index : -1;
  const rootPart = darkIdx !== -1 ? content.slice(0, darkIdx) : content;
  const darkPart = darkIdx !== -1 ? content.slice(darkIdx) : '';

  function extractMappings(block) {
    const result = {};
    // Match lines like:  --foo-bar: var(--p40);
    const lineRe = /(--[\w-]+):\s*var\(--([\w-]+)\)/g;
    let m;
    while ((m = lineRe.exec(block)) !== null) {
      result[m[1]] = m[2];
    }
    return result;
  }

  // Follow alias chains to their leaf palette step (up to 10 hops, cycle-safe).
  // e.g. --text-color → text-light-color → s10 returns s10.
  function resolveAliases(map, rootAll) {
    const resolved = {};
    for (const [key, val] of Object.entries(map)) {
      let current = val;
      for (let i = 0; i < 10; i++) {
        const next = rootAll['--' + current];
        if (next === undefined || next === current) break;
        current = next;
      }
      resolved[key] = current;
    }
    return resolved;
  }

  const rootAll = extractMappings(rootPart);
  const darkAll = extractMappings(darkPart);

  return {
    light: resolveAliases(rootAll, rootAll),
    dark:  resolveAliases(darkAll, rootAll),
    rawValues: (() => {
      const result = {};
      const baseVarsContent = fs.readFileSync(BASE_VARS, 'utf8');
      // Captures both plain numerics (0.87) and px values (2px).
      const re = /(--[\w-]+):\s*(-?(?:\d+\.?\d*|\.\d+)(?:px)?)\s*;/g;
      let m;
      while ((m = re.exec(baseVarsContent)) !== null) {
        result[m[1]] = m[2];
      }
      return result;
    })(),
  };
}

// ---- File writing helpers ----

// Replace a single CSS var value line in a file.
// Matches: --varName: <anything>;
function replaceVarInFile(content, varName, newValue) {
  // Escape var name for regex
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`([ \\t]*${escaped}:[ \\t]*)([^;]+)(;)`, 'g');
  return content.replace(re, (_, prefix, _old, semi) => {
    return `${prefix}${newValue}${semi}`;
  });
}

// Write palette changes to _base.css
function savePalette(changes) {
  let content = fs.readFileSync(PALETTE, 'utf8');
  for (const [varName, value] of Object.entries(changes)) {
    content = replaceVarInFile(content, varName, value);
  }
  fs.writeFileSync(PALETTE, content, 'utf8');
}

// Parse all editable palette vars from _base.css
// Returns a flat object: { p10: '0 25 68', p20: '0 45 109', ... }
function parsePalette() {
  const content = fs.readFileSync(PALETTE, 'utf8');
  const result = {};
  const re = /--(([psn]|[ryg])\d+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    result[m[1]] = m[3].trim().replace(/\s+/g, ' ');
  }
  return result;
}

// Full rewrite of the palette :root {} block in _base.css from a flat vars
// object. The block is delimited by two sentinel comments:
//   /* ===== PALETTE ===== */    \u2014 marks the start; everything before
//                                  (including the Google Fonts @import and
//                                  file header) is preserved verbatim.
//   /* ===== BASE VARS ===== */  \u2014 marks the end; everything from this
//                                  marker on is preserved verbatim.
// chart-* vars are preserved from the existing file.
function writePaletteFull(newVars) {
  const content = fs.readFileSync(PALETTE, 'utf8');

  const palMark  = '/* ===== PALETTE =====';
  const baseMark = '/* ===== BASE VARS =====';
  const palIdx   = content.indexOf(palMark);
  const baseIdx  = content.indexOf(baseMark);
  if (palIdx === -1 || baseIdx === -1 || baseIdx < palIdx) {
    throw new Error('writePaletteFull: PALETTE / BASE VARS sentinels missing or out of order in _base.css');
  }
  // Head: everything up to and including the PALETTE marker line.
  const palLineEnd = content.indexOf('\n', palIdx) + 1;
  const head       = content.slice(0, palLineEnd);
  // Tail: everything from the BASE VARS marker onwards.
  const tail       = content.slice(baseIdx);

  // Preserve chart vars from the existing file (they live inside the palette block).
  const chartVals = {};
  const chartRe = /--(chart-[\w-]+):\s*([^;]+);/g;
  let m;
  while ((m = chartRe.exec(content)) !== null) {
    chartVals[m[1]] = m[2].trim();
  }

  // Group and sort newVars by prefix then numeric suffix.
  const groups = { p: [], s: [], n: [], r: [], y: [], g: [] };
  for (const [name, val] of Object.entries(newVars)) {
    const prefix = name.match(/^[a-z]+/)[0];
    if (groups[prefix]) groups[prefix].push({ name, val });
  }
  const numSuffix = (name) => parseInt(name.match(/\d+$/)[0], 10);
  for (const prefix of Object.keys(groups)) {
    groups[prefix].sort((a, b) => numSuffix(a.name) - numSuffix(b.name));
  }

  const V = ({ name, val }) => `  --${name}: ${val};`;

  const block = [
    '   Raw RGB channels for every colour stop. The playground server regenerates',
    '   this block in full on palette writes \u2014 it is delimited by the',
    '   /* ===== PALETTE ===== */ and /* ===== BASE VARS ===== */ markers below',
    '   and must not be deleted.',
    '   ========================================================================== */',
    '',
    ':root {',
    '',
    '  /* ---- Primary palette (p) \u2014 replace from Figma ---- */',
    ...groups.p.map(V),
    '',
    '  /* ---- Secondary palette (s) \u2014 replace from Figma ---- */',
    ...groups.s.map(V),
    '',
    '  /* ---- Neutral palette (n) \u2014 replace from Figma ---- */',
    ...groups.n.map(V),
    '',
    '  /* ---- Meaning tones \u2014 two fixed tones per meaning, not full palettes ----',
    '     r = red/error, y = yellow/alert, g = green/success',
    '     30 = light mode tone, 70 = dark mode tone',
    '     Replace from Figma per project.',
    '     -------------------------------------------------------------------- */',
    ...groups.r.map(V),
    ...groups.y.map(V),
    ...groups.g.map(V),
    '',
    '  /* ---- Chart colours \u2014 replace from Figma per project ----',
    '     Applied at 81% opacity: rgb(var(--chart-1) / var(--chart-global-alpha))',
    '     -------------------------------------------------------- */',
  ];

  const chartOrder = ['chart-1','chart-2','chart-3','chart-4','chart-5','chart-6','chart-7','chart-8','chart-9','chart-global-alpha'];
  for (const k of chartOrder) {
    if (chartVals[k] !== undefined) block.push(`  --${k}: ${chartVals[k]};`);
  }
  block.push('', '}', '', '');

  fs.writeFileSync(PALETTE, head + block.join('\n') + tail, 'utf8');
}

// Write raw (non-var) base variable changes to _base.css.
// This is the ONLY file that contains raw values; _semantic-tokens.css is never written by this path.
function saveSemanticRaw(rawChanges) {
  let content = fs.readFileSync(BASE_VARS, 'utf8');
  for (const [varName, value] of Object.entries(rawChanges)) {
    content = replaceVarInFile(content, varName, value);
  }
  fs.writeFileSync(BASE_VARS, content, 'utf8');
}

// For Variables Naming Pattern tokens, resolve the alias var name to its base var counterpart before writing.
// Active alias:  {cat}-{type}-{property}          e.g. action-primary-default-color
// Base var:      {cat}-{type}-{mode}-{property}   e.g. action-primary-default-dark-color
// Mode is inserted before the last dash-segment (the property).
// Falls back to the original name if no matching base var exists.
function toBaseVarName(varName, mode, content) {
  const lastDash = varName.lastIndexOf('-');
  if (lastDash === -1) return varName;
  const baseVar = `${varName.slice(0, lastDash)}-${mode}${varName.slice(lastDash)}`;
  const escaped = baseVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`--${escaped}:`).test(content) ? baseVar : varName;
}

// Write semantic token changes to _semantic-tokens.css.
// Both light and dark changes are written to :root (all base vars live there).
// .dark {} is frozen — it contains only alias re-pointings and is never modified.
function saveSemantic(lightChanges, darkChanges) {
  let content = fs.readFileSync(SEMANTIC, 'utf8');
  const darkSplit = content.match(/^\.dark\s*\{/m);
  const darkIdx = darkSplit ? darkSplit.index : -1;
  let rootPart = darkIdx !== -1 ? content.slice(0, darkIdx) : content;
  const darkPart = darkIdx !== -1 ? content.slice(darkIdx) : ''; // frozen — alias re-pointings only

  for (const [varName, value] of Object.entries(lightChanges || {})) {
    const target = toBaseVarName(varName, 'light', rootPart);
    rootPart = replaceVarInFile(rootPart, target, `var(--${value})`);
  }
  for (const [varName, value] of Object.entries(darkChanges || {})) {
    const target = toBaseVarName(varName, 'dark', rootPart);
    rootPart = replaceVarInFile(rootPart, target, `var(--${value})`);
  }
  fs.writeFileSync(SEMANTIC, rootPart + darkPart, 'utf8');
}

// Build a Google Fonts CSS2 API URL from a font entry (mirrors client buildGFUrl).
function buildGFUrlServer(entry) {
  const sorted = [...entry.weights].map(Number).sort((a, b) => a - b);
  const encoded = entry.name.replace(/ /g, '+');
  if (entry.italic) {
    const regular = sorted.map(w => `0,${w}`).join(';');
    const italic  = sorted.map(w => `1,${w}`).join(';');
    return `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@${regular};${italic}&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${sorted.join(';')}&display=swap`;
}

// Write font-family and letter-spacing changes to _base.css.
// fontImports (array of { name, weights, italic }) triggers @import reconstruction.
function saveFonts(fontChanges, fontImports) {
  let content = fs.readFileSync(FONTS_CSS, 'utf8');

  if (fontImports && fontImports.length > 0) {
    const newImports = fontImports
      .map(e => `@import url('${buildGFUrlServer(e)}');`)
      .join('\n');
    if (/@import url\(/.test(content)) {
      // Replace the existing @import block in one pass
      content = content.replace(/((?:@import url\([^)]+\);[ \t]*\r?\n?)+)/, newImports + '\n');
    } else {
      // No existing imports — insert after header comment
      const commentEnd = content.indexOf('*/');
      const insertAt = commentEnd !== -1 ? content.indexOf('\n', commentEnd) + 1 : 0;
      content = content.slice(0, insertAt) + '\n' + newImports + '\n' + content.slice(insertAt);
    }
  }

  for (const [cssVar, value] of Object.entries(fontChanges || {})) {
    content = replaceVarInFile(content, cssVar, value);
  }

  fs.writeFileSync(FONTS_CSS, content, 'utf8');
}

// Write f-scale and line-height values to _base.css.
// scaleValues: { f1..f15, lb1..lb8, lt1..lt15, ld6..ld15 } — plain numbers (px without unit).
function saveScale(scaleValues) {
  let content = fs.readFileSync(THEME_CSS, 'utf8');
  for (const [key, val] of Object.entries(scaleValues)) {
    let cssVar;
    if (/^f\d+$/.test(key))  cssVar = `--font-size-f${key.slice(1)}`;
    else if (/^lb\d+$/.test(key)) cssVar = `--line-height-lb${key.slice(2)}`;
    else if (/^lt\d+$/.test(key)) cssVar = `--line-height-lt${key.slice(2)}`;
    else if (/^ld\d+$/.test(key)) cssVar = `--line-height-ld${key.slice(2)}`;
    if (cssVar) content = replaceVarInFile(content, cssVar, `${val}px`);
  }
  fs.writeFileSync(THEME_CSS, content, 'utf8');
}

// ---- MIME types ----
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
};

// ---- Request handler ----
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // --- Config endpoint ---
  if (pathname === '/config' && req.method === 'GET') {
    try {
      const config = parseSemanticConfig();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(config));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // --- Palette endpoint — raw palette vars grouped by prefix ---
  if (pathname === '/palette' && req.method === 'GET') {
    try {
      const vars = parsePalette();
      const groups = {};
      for (const [name, val] of Object.entries(vars)) {
        const prefix = name.match(/^[a-z]+/)[0];
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push({ name, val });
      }
      const numSuffix = (name) => parseInt(name.match(/\d+$/)[0], 10);
      for (const prefix of Object.keys(groups)) {
        groups[prefix].sort((a, b) => numSuffix(a.name) - numSuffix(b.name));
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(groups));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // --- SSE endpoint ---
  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  // --- Save endpoint ---
  if (pathname === '/save' && req.method === 'POST') {
    let body     = '';
    let bodySize  = 0;
    let bodyCapped = false;
    req.on('data', chunk => {
      if (bodyCapped) return;
      bodySize += chunk.length;
      if (bodySize > 1_048_576) {
        bodyCapped = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Request too large' }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (bodyCapped) return;
      try {
        const { palette = {}, semanticLight = {}, semanticDark = {}, semanticRaw = {},
                fonts = {}, fontImports = null, scale = null } = JSON.parse(body);

        if (palette.mode === 'full') {
          writePaletteFull(palette.vars || {});
        } else if (palette.mode === 'patch' && Object.keys(palette.changes || {}).length) {
          savePalette(palette.changes);
        } else if (!palette.mode && Object.keys(palette).length) {
          // backward compat — old format was a flat object of changes
          savePalette(palette);
        }
        if (Object.keys(semanticLight).length || Object.keys(semanticDark).length)
          saveSemantic(semanticLight, semanticDark);
        if (Object.keys(semanticRaw).length)
          saveSemanticRaw(semanticRaw);
        if (Object.keys(fonts).length || fontImports)
          saveFonts(fonts, fontImports);
        if (scale && Object.keys(scale).length)
          saveScale(scale);

        if (buildInFlight) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Build already in progress — please retry' }));
          return;
        }
        buildInFlight = true;
        // Rebuild CSS — stamp distMtime before broadcasting so fs.watch
        // sees no mtime change and stays silent (avoids double broadcast).
        exec('npm run build:css', { cwd: ROOT }, (err, stdout, stderr) => {
          buildInFlight = false;
          distMtime = fs.existsSync(DIST_CSS) ? fs.statSync(DIST_CSS).mtimeMs : distMtime;
          if (err) {
            console.error('Build error:', stderr);
            broadcast('rebuild-error');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: stderr }));
          } else {
            console.log('Build ok:', stdout.trim());
            broadcast('rebuild-done');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          }
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // --- CORS preflight ---
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  // --- Static files ---
  let filePath = pathname === '/' ? '/playground/index.html' : pathname;
  // Resolve to an absolute path and guard against path-traversal attacks.
  filePath = path.resolve(ROOT, filePath.startsWith('/') ? filePath.slice(1) : filePath);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + pathname);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\nMODS Playground running at http://localhost:${PORT}\n`);
});
