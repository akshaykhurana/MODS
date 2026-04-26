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

const PORT      = 3001;
const ROOT      = __dirname;
const PALETTE   = path.join(ROOT, 'src', '_base-palette.css');
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
let distMtime = fs.existsSync(DIST_CSS) ? fs.statSync(DIST_CSS).mtimeMs : 0;
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
    const re = /--[\w-]+:\s*var\(--([\w-]+)\)/g;
    const lineRe = /(--[\w-]+):\s*var\(--([\w-]+)\)/g;
    let m;
    while ((m = lineRe.exec(block)) !== null) {
      result[m[1]] = m[2];
    }
    return result;
  }

  return {
    light: extractMappings(rootPart),
    dark:  extractMappings(darkPart),
  };
}

// ---- File writing helpers ----

// Replace a single CSS var value line in a file.
// Matches: --varName: <anything>;
function replaceVarInFile(content, varName, newValue) {
  // Escape var name for regex
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`([ \\t]*${escaped}:[ \\t*)([^;]+)(;)`, 'g');
  return content.replace(re, (_, prefix, _old, semi) => {
    return `${prefix}${newValue}${semi}`;
  });
}

// Write palette changes to _base-palette.css
function savePalette(changes) {
  let content = fs.readFileSync(PALETTE, 'utf8');
  for (const [varName, value] of Object.entries(changes)) {
    content = replaceVarInFile(content, varName, value);
  }
  fs.writeFileSync(PALETTE, content, 'utf8');
}

// Parse all editable palette vars from _base-palette.css
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

// Full rewrite of _base-palette.css from a flat vars object.
// shadow-color and chart-* are preserved from the existing file.
function writePaletteFull(newVars) {
  const content = fs.readFileSync(PALETTE, 'utf8');

  // Preserve shadow-color
  const shadowMatch = content.match(/--shadow-color:\s*([^;]+);/);
  const shadowVal = shadowMatch ? shadowMatch[1].trim() : '20 10 51';

  // Preserve chart vars
  const chartVals = {};
  const chartRe = /--(chart-[\w-]+):\s*([^;]+);/g;
  let m;
  while ((m = chartRe.exec(content)) !== null) {
    chartVals[m[1]] = m[2].trim();
  }

  // Group and sort newVars by prefix then numeric suffix
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

  const lines = [
    '/* ==========================================================================',
    '   _base-palette.css',
    '   Tier 1 — Raw palette vars. All values are raw RGB channels (no rgb() wrapper)',
    '   so alpha can be applied at point of use: rgb(var(--p40) / 0.87)',
    '   Replace all placeholder values from Figma per project.',
    '   ========================================================================== */',
    '',
    ':root {',
    '',
    '  /* ---- Primary palette (p) — replace from Figma ---- */',
    ...groups.p.map(V),
    '',
    '  /* ---- Secondary palette (s) — replace from Figma ---- */',
    ...groups.s.map(V),
    '',
    '  /* ---- Neutral palette (n) — replace from Figma ---- */',
    ...groups.n.map(V),
    '',
    '  /* ---- Meaning tones — two fixed tones per meaning, not full palettes ----',
    '     r = red/error, y = yellow/alert, g = green/success',
    '     30 = light mode tone, 70 = dark mode tone',
    '     Replace from Figma per project.',
    '     -------------------------------------------------------------------- */',
    ...groups.r.map(V),
    ...groups.y.map(V),
    ...groups.g.map(V),
    '',
    '  /* ---- Shadow base — raw RGB channels for 3-layer shadow composition ---- */',
    `  --shadow-color: ${shadowVal};`,
    '',
    '  /* ---- Chart colours — replace from Figma per project ----',
    '     Applied at 81% opacity: rgb(var(--chart-1) / var(--chart-alpha))',
    '     -------------------------------------------------------- */',
  ];

  const chartOrder = ['chart-1','chart-2','chart-3','chart-4','chart-5','chart-6','chart-7','chart-8','chart-9','chart-alpha'];
  for (const k of chartOrder) {
    if (chartVals[k] !== undefined) lines.push(`  --${k}: ${chartVals[k]};`);
  }
  lines.push('', '}', '');

  fs.writeFileSync(PALETTE, lines.join('\n'), 'utf8');
}

// Write semantic token changes to _semantic-tokens.css
// light changes go into :root, dark changes go into .dark {}
function saveSemantic(lightChanges, darkChanges) {
  let content = fs.readFileSync(SEMANTIC, 'utf8');
  const darkSplit = content.match(/^\.dark\s*\{/m);
  const darkIdx = darkSplit ? darkSplit.index : -1;
  let rootPart = darkIdx !== -1 ? content.slice(0, darkIdx) : content;
  let darkPart = darkIdx !== -1 ? content.slice(darkIdx) : '';

  for (const [varName, value] of Object.entries(lightChanges || {})) {
    rootPart = replaceVarInFile(rootPart, varName, `var(--${value})`);
  }
  for (const [varName, value] of Object.entries(darkChanges || {})) {
    darkPart = replaceVarInFile(darkPart, varName, `var(--${value})`);
  }
  fs.writeFileSync(SEMANTIC, rootPart + darkPart, 'utf8');
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
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { palette = {}, semanticLight = {}, semanticDark = {} } = JSON.parse(body);

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

        // Rebuild CSS
        exec('npm run build:css', { cwd: ROOT }, (err, stdout, stderr) => {
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
  let filePath = pathname === '/' ? '/playground.html' : pathname;
  filePath = path.join(ROOT, filePath);

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
