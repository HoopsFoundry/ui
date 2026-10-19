# Logo von HoopsFoundry UI

Das Zeichen zeigt ein H, einen Korb-Ring, einen Spieler und ein F in der Signalfarbe S2 (`#f2561d`, Orangerot); das übrige Zeichen ist Ash (`#24292f`, ein dunkles Grau statt Schwarz). Alle Dateien sind SVG mit sauberer `viewBox` und ohne feste Breite und Höhe; sie skalieren in `<img>` und als Hintergrund über die Höhe oder Breite, die du vorgibst. Die Seite „Foundation/Logo“ in der Storybook-Doku zeigt Varianten, Mindestgröße, Schutzraum und ein Footer-Beispiel.

| Datei | Einsatz | im npm-Paket |
| --- | --- | --- |
| `logo-claim.svg` | Logo mit Wortmarke und Claim auf hellem Grund; Zeichen und „Hoops“ Ash, „Foundry“ S2, Claim Ash | nein |
| `logo-claim-hell.svg` | dieselbe Fassung für dunklen Grund: Zeichen und „Hoops“ weiß, „Foundry“ S2, Claim hellgrau (`#c9d1d9`) | nein |
| `logo-wortmarke.svg` | Wortmarke ohne Claim auf hellem Grund (Zeichen und „HoopsFoundry“), für enge Stellen wie die Seitenleiste der Doku; Zeichen und „Hoops“ Ash, „Foundry“ S2 | nein |
| `logo-wortmarke-hell.svg` | dieselbe Fassung für dunklen Grund: Zeichen und „Hoops“ weiß, „Foundry“ S2 | nein |
| `logo-farbig.svg` | Zeichen allein für hellen Grund, Ash mit F in S2 | nein |
| `logo-farbig-dunkel.svg` | Zeichen allein für dunklen Grund, weiß mit F in S2 | nein |
| `logo-einfarbig.svg` | Zeichen allein in einer Farbe (`currentColor`) | nein |
| `logo-app-icon.svg` | App-Symbol für hellen Grund: weißes Zeichen (F in S2) auf Ash-farbener, abgerundeter Kachel | nein |
| `logo-app-icon-dunkel.svg` | App-Symbol für dunklen Grund, invertiert: Ash-Zeichen (F in S2) auf weißer Kachel | nein |
| `favicon.svg` | Favicon der Doku: schaltet per `prefers-color-scheme` zwischen App-Icon und invertierter Fassung um | nein |
| `logo-icon-farbig.svg` | Footer-Icon für hellen Grund, eng beschnitten, Ash mit F in S2 | ja |
| `logo-icon-farbig-dunkel.svg` | Footer-Icon für dunklen Grund, eng beschnitten, weiß mit F in S2 | ja |
| `logo-icon.svg` | Footer-Icon einfarbig (`currentColor`) | ja |
| `social-preview.png` | Vorschaubild für das GitHub-Repository, 1280 × 640 | nein |

Das Social-Preview-Bild entsteht mit `node scripts/make-social-preview.mjs` aus `logo-claim.svg`. Hochladen muss es der Projektinhaber selbst (GitHub: Settings → Social preview).

## Footer-Icon

Im Paket liegen nur die Footer-Icons: `@hoopsfoundry/ui/logo/logo-icon.svg`, `@hoopsfoundry/ui/logo/logo-icon-farbig.svg` (heller Grund) und `@hoopsfoundry/ui/logo/logo-icon-farbig-dunkel.svg` (dunkler Grund). Anwendungen, die HoopsFoundry UI einsetzen, dürfen sie im Footer zeigen, am besten mit dem Text „Powered by HoopsFoundry UI“ und einem Link auf die Projektseite (Adresse: Feld `domain` in `project.config.json`). Steht der Text daneben, bekommt das Bild `alt=""`; steht das Icon allein, trägt `alt` den Namen des Links.

Mindestgröße: Icon ab 16 px Höhe, Wortmarke ohne Claim ab 24 px Höhe, Logo mit Claim ab 48 px Höhe (Kontraste und Begründung der Farben: Storybook-Seite „Foundation/Logo“, Abschnitt „Farben“). Regel: je Untergrund eine Fassung, Ash nie auf einer dunklen Fläche (auf Schwarz nur 1,43:1). Schutzraum: mindestens ein Viertel der Zeichenbreite rundum.

## Marke und Nutzung

Das Logo und der Name HoopsFoundry sind von der MIT-Lizenz des Codes ausgenommen (siehe `LICENSE`). Nutzung ist erlaubt, um das Projekt zu kennzeichnen oder anzugeben, dass eine Anwendung HoopsFoundry UI verwendet. Nicht erlaubt ist sie für abgeleitete Produkte oder so, dass der Eindruck einer Zugehörigkeit oder Billigung durch das Projekt entsteht. Das Zeichen darf nicht verzerrt, gedreht, umgefärbt (außer der einfarbigen Fassung) oder in seinen Teilen verändert werden. Dieser Hinweis ist keine Rechtsberatung.

## Schrift im Logo mit Claim

Wortmarke und Claim (auch in den Wortmarken-Dateien ohne Claim) sind als Pfade ausgegeben (kein Text, keine Schrift zum Laden). Die Glyphen stammen aus der Schrift PT Mono Bold (ParaType Free Font Licence). Die Lizenzbedingungen für die Umwandlung in Pfade prüft der Projektinhaber.
