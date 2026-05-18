/** Dark-mode live override target (AGENT_GUIDE: body beats html for setProperty). */
export function isDark() {
  return document.body.classList.contains('dark');
}

export function liveTokenTarget() {
  return isDark() ? document.body : document.documentElement;
}
