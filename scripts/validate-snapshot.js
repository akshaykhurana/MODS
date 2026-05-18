#!/usr/bin/env node
/**
 * Compare token names between a mods-snapshot and fresh MODS source files.
 * Usage: node scripts/validate-snapshot.js <snapshot-dir> <src/_base.css> <src/_semantic-tokens.css>
 */
const fs = require('fs');
const path = require('path');

function tokenNames(content) {
  const names = new Set();
  const re = /(--[\w-]+):/g;
  let m;
  while ((m = re.exec(content)) !== null) names.add(m[1]);
  return names;
}

function main() {
  const [snapDir, basePath, semPath] = process.argv.slice(2);
  if (!snapDir || !basePath || !semPath) {
    console.error('Usage: node scripts/validate-snapshot.js <snapshot-dir> <_base.css> <_semantic-tokens.css>');
    process.exit(1);
  }

  const snapBase = fs.readFileSync(path.join(snapDir, '_base.css'), 'utf8');
  const snapSem = fs.readFileSync(path.join(snapDir, '_semantic-tokens.css'), 'utf8');
  const freshBase = fs.readFileSync(basePath, 'utf8');
  const freshSem = fs.readFileSync(semPath, 'utf8');

  const snapTokens = new Set([...tokenNames(snapBase), ...tokenNames(snapSem)]);
  const freshTokens = new Set([...tokenNames(freshBase), ...tokenNames(freshSem)]);

  const removed = [...snapTokens].filter(t => !freshTokens.has(t));
  const added = [...freshTokens].filter(t => !snapTokens.has(t));

  console.log('MODS snapshot validation\n');
  if (removed.length) {
    console.log(`Removed or renamed in fresh source (${removed.length}):`);
    removed.forEach(t => console.log(`  - ${t}`));
  } else {
    console.log('No tokens removed from snapshot.');
  }
  if (added.length) {
    console.log(`\nNew in fresh source (${added.length}):`);
    added.forEach(t => console.log(`  + ${t}`));
  } else {
    console.log('\nNo new tokens in fresh source.');
  }
  console.log('\nDone (informational — exit 0).');
}

main();
