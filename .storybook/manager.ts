import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Marke in der Seitenleiste: Logo mit Claim. Das Logo ist schwarz, deshalb gibt es für den dunklen Modus die helle Fassung
// (logo/logo-claim-hell.svg). Der Manager folgt der Einstellung des Geräts (`prefers-color-scheme`); die Bilder liegen über
// `staticDirs` (main.ts) unter `logo/`. Der Pfad ist relativ, damit die Doku auch unter einem Unterpfad (Webspace, GitHub Pages) lädt.
const scheme = window.matchMedia('(prefers-color-scheme: dark)');

function themeFor(dark: boolean) {
  return create({
    base: dark ? 'dark' : 'light',
    brandTitle: 'HoopsFoundry UI',
    brandUrl: './',
    brandImage: dark ? './logo/logo-claim-hell.svg' : './logo/logo-claim.svg',
  });
}

addons.setConfig({ theme: themeFor(scheme.matches) });
// Wechselt das Gerät während des Betrachtens zwischen hell und dunkel, zieht die Marke nach.
scheme.addEventListener('change', (e) => addons.setConfig({ theme: themeFor(e.matches) }));
