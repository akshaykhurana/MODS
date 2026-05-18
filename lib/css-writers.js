// Pure CSS read/write helpers — shared by server.js and tests.

function replaceVarInFile(content, varName, newValue) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`([ \\t]*${escaped}:[ \\t]*)([^;]+)(;)`, 'g');
  return content.replace(re, (_, prefix, _old, semi) => `${prefix}${newValue}${semi}`);
}

function isSemanticAlias(varName) {
  return /-color$/.test(varName) &&
         !/-(?:light|dark|global)-color$/.test(varName);
}

function extractMappings(block) {
  const result = {};
  const lineRe = /(--[\w-]+):\s*var\(--([\w-]+)\)/g;
  let m;
  while ((m = lineRe.exec(block)) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

function resolveAliases(map, rootAll) {
  const resolved = {};
  for (const [key, val] of Object.entries(map)) {
    let current = val;
    for (let i = 0; i < 10; i++) {
      const next = rootAll['--' + current];
      if (next === undefined || next === current) break;
      if (isSemanticAlias(current)) break;
      current = next;
    }
    resolved[key] = current;
  }
  return resolved;
}

function parseSemanticContent(content) {
  const darkMatch = content.match(/^\.dark\s*\{/m);
  const darkIdx = darkMatch ? darkMatch.index : -1;
  const rootPart = darkIdx !== -1 ? content.slice(0, darkIdx) : content;
  const darkPart = darkIdx !== -1 ? content.slice(darkIdx) : '';

  const rootAll = extractMappings(rootPart);
  const darkAll = extractMappings(darkPart);

  return {
    light: resolveAliases(rootAll, rootAll),
    dark: resolveAliases(darkAll, rootAll),
  };
}

function toBaseVarName(varName, mode, content) {
  const lastDash = varName.lastIndexOf('-');
  if (lastDash === -1) return varName;
  const baseVar = `${varName.slice(0, lastDash)}-${mode}${varName.slice(lastDash)}`;
  const escaped = baseVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`--${escaped}:`).test(content) ? baseVar : varName;
}

function applySemanticSave(content, lightChanges, darkChanges) {
  const darkSplit = content.match(/^\.dark\s*\{/m);
  const darkIdx = darkSplit ? darkSplit.index : -1;
  let rootPart = darkIdx !== -1 ? content.slice(0, darkIdx) : content;
  const darkPart = darkIdx !== -1 ? content.slice(darkIdx) : '';

  for (const [varName, value] of Object.entries(lightChanges || {})) {
    const target = toBaseVarName(varName, 'light', rootPart);
    rootPart = replaceVarInFile(rootPart, target, `var(--${value})`);
  }
  for (const [varName, value] of Object.entries(darkChanges || {})) {
    const target = toBaseVarName(varName, 'dark', rootPart);
    rootPart = replaceVarInFile(rootPart, target, `var(--${value})`);
  }
  return rootPart + darkPart;
}

module.exports = {
  replaceVarInFile,
  isSemanticAlias,
  extractMappings,
  resolveAliases,
  parseSemanticContent,
  toBaseVarName,
  applySemanticSave,
};
