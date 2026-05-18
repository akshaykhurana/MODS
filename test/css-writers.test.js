const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  replaceVarInFile,
  toBaseVarName,
  parseSemanticContent,
  applySemanticSave,
  isSemanticAlias,
} = require('../lib/css-writers');

const fixture = fs.readFileSync(
  path.join(__dirname, 'fixtures/semantic-snippet.css'),
  'utf8'
);

describe('replaceVarInFile', () => {
  it('updates one token without touching others', () => {
    const input = ':root {\n  --a: 1;\n  --b: 2;\n}';
    const out = replaceVarInFile(input, '--a', '9');
    assert.match(out, /--a:\s*9;/);
    assert.match(out, /--b:\s*2;/);
  });
});

describe('toBaseVarName', () => {
  it('resolves dark base var when present', () => {
    const root = ':root { --action-primary-default-dark-color: p80; }';
    const name = toBaseVarName('action-primary-default-color', 'dark', root);
    assert.equal(name, 'action-primary-default-dark-color');
  });

  it('falls back to alias when base var missing', () => {
    const root = ':root { --foo-color: p10; }';
    const name = toBaseVarName('foo-color', 'dark', root);
    assert.equal(name, 'foo-color');
  });
});

describe('isSemanticAlias', () => {
  it('identifies active color aliases', () => {
    assert.equal(isSemanticAlias('text-color'), true);
    assert.equal(isSemanticAlias('text-light-color'), false);
  });
});

describe('parseSemanticContent', () => {
  it('resolves alias chain to palette step', () => {
    const { light } = parseSemanticContent(fixture);
    assert.equal(light['--text-color'], 's10');
    assert.equal(light['--action-primary-default-color'], 'p40');
  });

  it('stops at cross-category semantic alias', () => {
    const { light } = parseSemanticContent(fixture);
    assert.equal(light['--action-primary-label-light-color'], 'text-invert-color');
  });
});

describe('applySemanticSave', () => {
  it('writes light and dark base vars in :root only', () => {
    const out = applySemanticSave(fixture, {
      'action-primary-default-color': 'p50',
    }, {
      'action-primary-default-color': 'p70',
    });
    assert.match(out, /--action-primary-default-light-color:\s*var\(--p50\)/);
    assert.match(out, /--action-primary-default-dark-color:\s*var\(--p70\)/);
    assert.doesNotMatch(out, /^\.dark[\s\S]*--action-primary-default-light-color/m);
  });
});
