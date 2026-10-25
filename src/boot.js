/* =========================================================================
   Start: Ansichten beobachten, Deep-Link (#id) auswerten, Schleife starten
   ========================================================================= */
/* Tabs nach der Nummer im Titel sortieren (Reihenfolge der Definition ist egal) */
[...tabsEl.children]
  .map(b => ({ b, n: parseInt(b.textContent, 10) }))
  .sort((a, b) => (isNaN(a.n) ? 99 : a.n) - (isNaN(b.n) ? 99 : b.n))
  .forEach(x => tabsEl.append(x.b));

views.forEach(v => {
  if (v.stage.isConnected) {
    const ro = new ResizeObserver(() => v.resize());
    ro.observe(v.stage);
  }
});
window.addEventListener('resize', () => views.forEach(v => v.resize()));
const hStart = location.hash.replace('#', '');
showView(views.find(v => v.id === hStart) || views.find(v => v.id === 'start') || views[0]);
window.addEventListener('hashchange', () => {
  const v = views.find(x => x.id === location.hash.replace('#', ''));
  if (v) showView(v);
});
requestAnimationFrame(frame);
