/**
 * HoopsFoundry UI AppNav · Vanilla-Verhalten
 * --------------------------------------------------------------
 * Ergänzt das Markup der AppNav (css/components.css) um Verhalten, ohne Framework:
 * Hamburger-Menü, Gruppen-Dropdowns (Disclosure), Esc, Klick außerhalb, Fokusverlust.
 *
 * Markup-Vertrag (Klassen siehe components.css):
 *   <nav class="hoops-appnav hoops-appnav--light" data-hoops-appnav aria-label="Hauptnavigation">
 *     <div class="hoops-appnav-bar">
 *       <button type="button" class="hoops-appnav-toggle" data-appnav-toggle
 *               aria-expanded="false" aria-controls="nav-list">Menü</button>
 *       <ul class="hoops-appnav-list" id="nav-list">
 *         <li class="hoops-appnav-item"><a class="hoops-appnav-link is-active" aria-current="page" href="/">Start</a></li>
 *         <li class="hoops-appnav-item">
 *           <button type="button" class="hoops-appnav-group-btn" data-appnav-group
 *                   aria-expanded="false" aria-controls="nav-g1">Gruppe</button>
 *           <ul class="hoops-appnav-panel" id="nav-g1" hidden>
 *             <li><a class="hoops-appnav-link" href="/a">Seite A</a></li>
 *           </ul>
 *         </li>
 *       </ul>
 *     </div>
 *   </nav>
 *
 * <script type="module" src="…/js/appnav.js"></script> initialisiert alle [data-hoops-appnav] automatisch.
 */
const OPEN = 'is-open';

/** Initialisiert eine AppNav; gibt eine Funktion zurück, die alle Listener entfernt und erneutes Initialisieren erlaubt. */
export function initAppNav(root) {
  if (root.dataset.hoopsAppnavReady) return () => {};
  root.dataset.hoopsAppnavReady = 'true';
  const controller = new AbortController();
  const { signal } = controller;

  const toggle = root.querySelector('[data-appnav-toggle]');
  const groups = Array.from(root.querySelectorAll('[data-appnav-group]'));

  const panelOf = (button) => document.getElementById(button.getAttribute('aria-controls'));
  const setGroup = (button, open) => {
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle(OPEN, open);
    const panel = panelOf(button);
    if (panel) panel.hidden = !open;
  };
  const closeGroups = () => groups.forEach((button) => setGroup(button, false));
  const setMenu = (open) => {
    root.classList.toggle(OPEN, open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  };

  if (toggle) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'), { signal });
  }

  groups.forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeGroups();
      setGroup(button, open);
    }, { signal });
  });

  root.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a[href]')) {
      closeGroups();
      setMenu(false);
    }
  }, { signal });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openButton = groups.find((button) => button.getAttribute('aria-expanded') === 'true');
    if (openButton) {
      closeGroups();
      openButton.focus();
    } else if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  }, { signal });

  root.addEventListener('focusout', (event) => {
    // relatedTarget null (z. B. Safari-Klick auf Button/Link) schließt bewusst nicht.
    if (event.relatedTarget && !root.contains(event.relatedTarget)) closeGroups();
  }, { signal });

  const onOutside = (event) => {
    if (!root.contains(event.target)) closeGroups();
  };
  document.addEventListener('mousedown', onOutside, { signal });
  return () => {
    controller.abort();
    delete root.dataset.hoopsAppnavReady;
  };
}

/** Initialisiert alle AppNavs im Bereich (Standard: ganzes Dokument). */
export function initAppNavs(scope = document) {
  return Array.from(scope.querySelectorAll('[data-hoops-appnav]')).map(initAppNav);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAppNavs());
  else initAppNavs();
}
