// Native details keeps the archive usable without JavaScript or storage.
const disclosure = document.querySelector('.archive-disclosure');
if (disclosure) {
  const desktop = matchMedia('(min-width: 1001px)');
  const preferenceKey = 'reader-archive-expanded';
  let desktopExpanded = true;
  try { desktopExpanded = localStorage.getItem(preferenceKey) !== 'false'; } catch {}
  const isDesktop = () => desktop.matches && document.documentElement.dataset.readerLayout !== 'drawer';
  const adapt = () => { disclosure.open = isDesktop() && desktopExpanded; };
  adapt();
  desktop.addEventListener('change', adapt);
  window.addEventListener('reader-layout-change', adapt);
  disclosure.addEventListener('toggle', () => {
    if (!isDesktop()) return;
    desktopExpanded = disclosure.open;
    try { localStorage.setItem(preferenceKey, String(desktopExpanded)); } catch {}
  });
}

// A month link in the year overview reveals its article list without navigation.
function revealArchiveMonth() {
  if(!location.hash.startsWith('#calendar-month-'))return;
  const target=document.getElementById(location.hash.slice(1));
  if(target?.matches('details.archive-month-posts'))target.open=true;
}
window.addEventListener('hashchange',revealArchiveMonth);
revealArchiveMonth();
