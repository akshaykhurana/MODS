#!/usr/bin/env node
/**
 * apply-snapshot.js
 *
 * Restores a project's branding decisions from a mods-snapshot directory
 * into the current MODS source files, then rebuilds.
 *
 * Usage:
 *   MODS_SNAPSHOT=../my-project/mods-snapshot npm run apply-snapshot
 *
 * What it restores:
 *   _base.css             — PALETTE and BASE VARS sections (user-editable raw tokens)
 *   _semantic-tokens.css  — all var() assignments in :root {}, .dark {}, and the
 *                           @media (prefers-color-scheme: dark) :root:not(.light) {} block
 *   _webfont-imports.css  — verbatim copy (if present in snapshot; older packs may not have it)
 *
 * What it leaves untouched:
 *   _base.css             — DO NOT EDIT section, TAILWIND THEME COMPOSITION, TYPE SCALE @theme block
 *   _semantic-tokens.css  — file structure, comments, whitespace, block wrappers
 *
 * Reports:
 *   Tokens in the snapshot that no longer exist in MODS → skipped with a warning
 *   Tokens new in MODS that were not in the snapshot   → kept at fresh defaults, reported
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Validate env ──────────────────────────────────────────────────────────

const snapshotDir = process.env.MODS_SNAPSHOT;
if (!snapshotDir) {
  console.error('Error: MODS_SNAPSHOT is not set.');
  console.error('Usage: MODS_SNAPSHOT=<path/to/mods-snapshot> npm run apply-snapshot');
  process.exit(1);
}

const snapBase     = path.resolve(snapshotDir, '_base.css');
const snapSemantic = path.resolve(snapshotDir, '_semantic-tokens.css');
const srcBase      = path.resolve(__dirname, '../src/_base.css');
const srcSemantic  = path.resolve(__dirname, '../src/_semantic-tokens.css');

for (const f of [snapBase, snapSemantic]) {
  if (!fs.existsSync(f)) {
    console.error(`Error: ${path.basename(f)} not found in ${snapshotDir}`);
    process.exit(1);
  }
}

// ── CSS helpers ───────────────────────────────────────────────────────────

/**
 * Locate the first block matching `pattern` in `css` and return its inner
 * content with character positions for later splicing.
 * Returns { content, start, end } or null.
 */
function extractBlock(css, pattern) {
  const matchIdx = css.search(pattern);
  if (matchIdx === -1) return null;
  const open = css.indexOf('{', matchIdx);
  if (open === -1) return null;
  let depth = 1;
  let i = open + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return { content: css.slice(open + 1, i - 1), start: open + 1, end: i - 1 };
}

/** Parse every `--name: value;` declaration from a CSS string → Map<name, value>. */
function parseTokens(css) {
  const map = new Map();
  for (const line of css.split('\n')) {
    const m = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+?)\s*;/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

/**
 * Apply snapshot token values to an array of CSS lines.
 * Only the value (RHS of `--name: value;`) is replaced — indentation,
 * colon-spacing, semicolon, and any inline comments are preserved.
 */
function applyTokensToLines(lines, snapshotTokens) {
  const applied    = new Set();
  const newInFile  = [];

  const result = lines.map(line => {
    // Groups: 1=indent+name  2=colon  3=spacing-after-colon  4=value  5=tail(;+comment)
    const m = line.match(/^(\s*--[\w-]+)(\s*:)(\s*)([^;]+?)(\s*;.*)$/);
    if (!m) return line;

    const nameM = m[1].match(/(--[\w-]+)$/);
    if (!nameM) return line;
    const name = nameM[1];

    if (snapshotTokens.has(name)) {
      applied.add(name);
      const [, lhs, colon, spacing, , tail] = m;
      return `${lhs}${colon}${spacing}${snapshotTokens.get(name)}${tail}`;
    }
    newInFile.push(name);
    return line;
  });

  const missing = [...snapshotTokens.keys()].filter(n => !applied.has(n));
  return { lines: result, applied, missing, newInFile };
}

// ── Restore _base.css ─────────────────────────────────────────────────────

console.log('\nRestoring _base.css…');

const snapBaseCSS   = fs.readFileSync(snapBase, 'utf8');
const targetBaseCSS = fs.readFileSync(srcBase,  'utf8');

// Extract PALETTE + BASE VARS tokens from the snapshot.
// Collecting begins at the PALETTE sentinel and stops before the TYPE SCALE
// @theme block (which is user-editable but intentionally not restored here —
// see AGENT_GUIDE.md Step 4 for font/type-scale guidance).
const baseSnapTokens = (() => {
  const tokens = new Map();
  let active = false;
  for (const line of snapBaseCSS.split('\n')) {
    if (line.includes('===== PALETTE ====='))                    active = true;
    if (line.includes('===== TYPE SCALE + FONT FAMILIES =====')) active = false;
    if (!active) continue;
    const m = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+?)\s*;/);
    if (m) tokens.set(m[1], m[2]);
  }
  return tokens;
})();

// Apply within the same section range in the target.
let activeSec  = false;
const appliedBase = new Set();
const newInBase   = [];

const newBaseLines = targetBaseCSS.split('\n').map(line => {
  if (line.includes('===== PALETTE ====='))                    activeSec = true;
  if (line.includes('===== TYPE SCALE + FONT FAMILIES =====')) activeSec = false;
  if (!activeSec) return line;

  const m = line.match(/^(\s*--[\w-]+)(\s*:)(\s*)([^;]+?)(\s*;.*)$/);
  if (!m) return line;
  const nameM = m[1].match(/(--[\w-]+)$/);
  if (!nameM) return line;
  const name = nameM[1];

  if (baseSnapTokens.has(name)) {
    appliedBase.add(name);
    const [, lhs, colon, spacing, , tail] = m;
    return `${lhs}${colon}${spacing}${baseSnapTokens.get(name)}${tail}`;
  }
  newInBase.push(name);
  return line;
});

fs.writeFileSync(srcBase, newBaseLines.join('\n'), 'utf8');

const missingInBase = [...baseSnapTokens.keys()].filter(n => !appliedBase.has(n));
if (missingInBase.length) {
  console.log('  Removed since snapshot (skipped):');
  missingInBase.forEach(n => console.log(`    - ${n}`));
}
if (newInBase.length) {
  console.log('  New since snapshot (kept at defaults):');
  newInBase.forEach(n => console.log(`    + ${n}`));
}
console.log(`  ${appliedBase.size} tokens restored.`);

// ── Restore _semantic-tokens.css ──────────────────────────────────────────

console.log('\nRestoring _semantic-tokens.css…');

const snapSemanticCSS   = fs.readFileSync(snapSemantic, 'utf8');
let   targetSemanticCSS = fs.readFileSync(srcSemantic,  'utf8');

// The semantic file has three addressable blocks. The @media :root:not(.light)
// block mirrors .dark — we apply the same dark tokens to both so OS-level dark
// mode stays in sync with the class-based .dark toggle.
const semanticBlocks = [
  { label: ':root {}',                    pattern: /^:root\s*\{/m },
  { label: '.dark {}',                    pattern: /^\.dark\s*\{/m },
  { label: '@media :root:not(.light) {}', pattern: /:root:not\(\.light\)\s*\{/m },
];

// Snapshot .dark tokens are used as a fallback for the @media block in case
// older snapshots pre-date its introduction.
const snapDarkTokens = (() => {
  const block = extractBlock(snapSemanticCSS, /^\.dark\s*\{/m);
  return block ? parseTokens(block.content) : new Map();
})();

let totalApplied = 0;
const allMissing = new Set();
const allNew     = new Set();

for (const { label, pattern } of semanticBlocks) {
  const isMediaBlock = label.startsWith('@media');

  // Source tokens for this block from the snapshot.
  const snapBlock   = extractBlock(snapSemanticCSS, pattern);
  const blockTokens = snapBlock
    ? parseTokens(snapBlock.content)
    : (isMediaBlock ? snapDarkTokens : null);

  if (!blockTokens || blockTokens.size === 0) continue;

  // Extract the corresponding block from the current (possibly already updated) target.
  const targetBlock = extractBlock(targetSemanticCSS, pattern);
  if (!targetBlock) {
    console.log(`  (no ${label} in target — skipped)`);
    continue;
  }

  const { lines, applied, missing, newInFile } =
    applyTokensToLines(targetBlock.content.split('\n'), blockTokens);

  // Splice updated block content back into the full CSS string.
  targetSemanticCSS =
    targetSemanticCSS.slice(0, targetBlock.start) +
    lines.join('\n') +
    targetSemanticCSS.slice(targetBlock.end);

  totalApplied += applied.size;
  missing.forEach(n  => allMissing.add(n));
  newInFile.forEach(n => allNew.add(n));
}

fs.writeFileSync(srcSemantic, targetSemanticCSS, 'utf8');

if (allMissing.size) {
  console.log('  Removed since snapshot (skipped):');
  [...allMissing].forEach(n => console.log(`    - ${n}`));
}
if (allNew.size) {
  console.log('  New since snapshot (kept at defaults):');
  [...allNew].forEach(n => console.log(`    + ${n}`));
}
console.log(`  ${totalApplied} tokens restored.`);

// ── Restore _webfont-imports.css ──────────────────────────────────────────

const snapWebfont = path.resolve(snapshotDir, '_webfont-imports.css');
const srcWebfont  = path.resolve(__dirname, '../src/_webfont-imports.css');

console.log('\nRestoring _webfont-imports.css…');
if (fs.existsSync(snapWebfont)) {
  fs.copyFileSync(snapWebfont, srcWebfont);
  console.log('  Restored (verbatim copy from snapshot).');
} else {
  console.log('  Not found in snapshot (older pack) — leaving current file unchanged.');
}

// ── Rebuild ────────────────────────────────────────────────────────────────

console.log('\nRebuilding CSS…');
try {
  execSync('npm run build:css', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });
} catch {
  console.error('\nBuild failed. Check src/ files for issues.');
  process.exit(1);
}

console.log('\nDone. Next:');
console.log('  MODS_DEST=<same-path-as-before> npm run pack\n');
