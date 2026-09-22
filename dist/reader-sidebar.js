// Native details keeps the archive usable without JavaScript or storage.
const disclosure = document.querySelector('.archive-disclosure');
if (disclosure) {
  const desktop = matchMedia('(min-width: 1001px)');
  const preferenceKey = 'reader-archive-expanded';
  let desktopExpanded = true;
  try { desktopExpanded = localStorage.getItem(preferenceKey) !== 'false'; } catch {}
  const adapt = () => { disclosure.open = desktop.matches && desktopExpanded; };
  adapt();
  desktop.addEventListener('change', adapt);
  disclosure.addEventListener('toggle', () => {
    if (!desktop.matches) return;
    desktopExpanded = disclosure.open;
    try { localStorage.setItem(preferenceKey, String(desktopExpanded)); } catch {}
  });
}
