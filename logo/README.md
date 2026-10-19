# Logo von HoopsFoundry UI

Das Zeichen zeigt ein H, einen Korb-Ring, einen Spieler und ein rotes F (Farbe `rgb(189, 0, 13)`). Alle Dateien sind SVG mit sauberer `viewBox` und ohne feste Breite und Höhe; sie skalieren in `<img>` und als Hintergrund über die Höhe oder Breite, die du vorgibst. Die Seite „Foundation/Logo“ in der Storybook-Doku zeigt Varianten, Mindestgröße, Schutzraum und ein Footer-Beispiel.

| Datei | Einsatz | im npm-Paket |
| --- | --- | --- |
| `logo-claim.svg` | Logo mit Wortmarke und Claim auf hellem Grund | nein |
| `logo-claim-hell.svg` | dieselbe Fassung in Weiß für dunklen Grund | nein |
| `logo-farbig.svg` | Zeichen allein, schwarz mit rotem F | nein |
| `logo-einfarbig.svg` | Zeichen allein in einer Farbe (`currentColor`) | nein |
| `logo-app-icon.svg` | weißes Zeichen auf schwarzer, abgerundeter Kachel (Favicon der Doku, App-Symbol) | nein |
| `logo-icon-farbig.svg` | Footer-Icon, eng beschnitten, schwarz mit rotem F | ja |
| `logo-icon.svg` | Footer-Icon einfarbig (`currentColor`) | ja |
| `social-preview.png` | Vorschaubild für das GitHub-Repository, 1280 × 640 | nein |

Das Social-Preview-Bild entsteht mit `node scripts/make-social-preview.mjs` aus `logo-claim.svg`. Hochladen muss es der Projektinhaber selbst (GitHub: Settings → Social preview).

## Footer-Icon

Im Paket liegen nur die zwei Footer-Icons: `@hoopsfoundry/ui/logo/logo-icon.svg` und `@hoopsfoundry/ui/logo/logo-icon-farbig.svg`. Anwendungen, die HoopsFoundry UI einsetzen, dürfen sie im Footer zeigen, am besten mit dem Text „Powered by HoopsFoundry UI“ und einem Link auf `https://ui.hoopsfoundry.com`. Steht der Text daneben, bekommt das Bild `alt=""`; steht das Icon allein, trägt `alt` den Namen des Links.

Mindestgröße: Icon ab 16 px Höhe, Logo mit Claim ab 40 px Höhe. Schutzraum: mindestens ein Viertel der Zeichenbreite rundum.

## Marke und Nutzung

Das Logo und der Name HoopsFoundry sind von der MIT-Lizenz des Codes ausgenommen (siehe `LICENSE`). Nutzung ist erlaubt, um das Projekt zu kennzeichnen oder anzugeben, dass eine Anwendung HoopsFoundry UI verwendet. Nicht erlaubt ist sie für abgeleitete Produkte oder so, dass der Eindruck einer Zugehörigkeit oder Billigung durch das Projekt entsteht. Das Zeichen darf nicht verzerrt, gedreht, umgefärbt (außer der einfarbigen Fassung) oder in seinen Teilen verändert werden. Dieser Hinweis ist keine Rechtsberatung.
