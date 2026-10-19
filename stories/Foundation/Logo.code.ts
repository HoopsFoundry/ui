import project from '../../project.config.json';

/** Adresse der Projektseite aus project.config.json (die eine Quelle; keine feste Adresse im Code). */
export const PROJEKT_URL = `https://${project.domain}`;

// Code-Beispiele der Seite „Logo“: das Footer-Icon in HTML, Svelte und React. Die Tests führen sie aus bzw. prüfen sie gegen die Dateien in logo/.

/** Icon neben Text: Der Text benennt den Link, das Bild ist Dekoration (`alt=""`). */
export const htmlNebenText = `<footer>
  <a href="${PROJEKT_URL}">
    <img src="/assets/logo-icon-farbig.svg" alt="" width="16" height="23" />
    <span>Powered by HoopsFoundry UI</span>
  </a>
</footer>`;

/** Nur das Icon als Link: Das Bild trägt den Namen des Links. */
export const htmlAllein = `<footer>
  <a href="${PROJEKT_URL}">
    <img src="/assets/logo-icon-farbig.svg" alt="HoopsFoundry UI" width="16" height="23" />
  </a>
</footer>`;

/** Einfarbig: Das Icon übernimmt die Textfarbe der Seite (hell wie dunkel). */
export const cssMaske = `.hoops-powered-icon {
  display: inline-block;
  width: 16px;
  height: 23px;
  background: currentColor;                 /* Farbe = Textfarbe */
  -webkit-mask: url('/assets/logo-icon.svg') center / contain no-repeat;
  mask: url('/assets/logo-icon.svg') center / contain no-repeat;
}`;

export const htmlMaske = `<a href="${PROJEKT_URL}">
  <span class="hoops-powered-icon" aria-hidden="true"></span>
  <span>Powered by HoopsFoundry UI</span>
</a>`;

export const svelte = `<script>
  import iconUrl from '@hoopsfoundry/ui/logo/logo-icon-farbig.svg';
</script>

<footer>
  <a href="${PROJEKT_URL}">
    <img src={iconUrl} alt="" width="16" height="23" />
    <span>Powered by HoopsFoundry UI</span>
  </a>
</footer>`;

export const react = `import iconUrl from '@hoopsfoundry/ui/logo/logo-icon-farbig.svg';

export function PoweredBy() {
  return (
    <footer>
      <a href="${PROJEKT_URL}">
        <img src={iconUrl} alt="" width="16" height="23" />
        <span>Powered by HoopsFoundry UI</span>
      </a>
    </footer>
  );
}`;

/** Dateien des Pakets, die unter @hoopsfoundry/ui/logo/ ausgeliefert werden (Test: package.json und npm pack). */
export const paketDateien = ['logo/logo-icon.svg', 'logo/logo-icon-farbig.svg'];
