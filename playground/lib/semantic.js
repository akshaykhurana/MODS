import { isDark, liveTokenTarget } from './live-tokens.js';

export function initSemanticSelects(deps) {
  const { markDirty, rebuildAPCA, updateSaveBar, dirtySemanticL, dirtySemanticD } = deps;

  document.querySelectorAll('.pg-swatch-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const swatch = sel.closest('.pg-swatch');
      const varName = sel.dataset.var;
      const mode = sel.dataset.mode;
      const chosen = sel.value;
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
