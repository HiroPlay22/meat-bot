// FILE: src/web/scripts/logo.js
// Logo-Auswahl (PNG, Xmas im Dezember)

export function applyLogos() {
  const targets = document.querySelectorAll('[data-logo-target]');
  if (!targets.length) return;

  const now = new Date();
  const isDecember = now.getMonth() === 11;

  const candidates = isDecember
    ? ['assets/logo/meat_logo_xmas.png', 'assets/logo/meat_logo.png']
    : ['assets/logo/meat_logo.png'];

  const url = candidates.find(Boolean);
  if (!url) return;

  targets.forEach((el) => {
    if (el.tagName.toLowerCase() === 'img') {
      el.setAttribute('src', url);
    }
  });
}
