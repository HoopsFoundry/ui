// Hallenkarte. Die Beispiele sind gegen die echten Komponenten geprüft (tests/venue-code.test.ts): Svelte per Server-Rendering, React per
// TypeScript-Compiler, das Vanilla-Markup gegen die Ausgabe der Svelte- und der React-Fassung.
export const vanilla = `<!-- Vanilla: die Hallenkarte ist reines Markup mit den Klassen hoops-venue* (css/components.css); aus Daten erzeugt sie mountVenueCard
     (Abschnitt „Vanilla: Hallenkarte aus Daten erzeugen“). Hier von Hand: Die Karte links ist die Map: statt der Komponente
     schreibst du den Platzhalter der Karte selbst (hoops-map*) und lädst Leaflet nach dem Klick auf „Karte laden“ (npm install leaflet, dazu leaflet.css).
     Links tel: und mailto: baust du mit telHref() und mailHref(), die Links unter der Karte mit mapLinks() (map.js, venue.js). -->
<div class="hoops-venue hoops-venue--standard hoops-venue--map">
  <div class="hoops-venue-in">
    <div class="hoops-venue-map">
      <div class="hoops-map" data-state="idle" data-dim="true" data-tiles="dim" style="--hoops-map-h:250px">
        <a class="hoops-map-skip" href="#halle-karte-text">Karte überspringen</a>
        <div class="hoops-map-frame" role="region" aria-label="Karte: Sporthalle Nordhain">
          <div class="hoops-map-stage">
            <div class="hoops-map-ph">
              <span class="hoops-map-ph-pin" style="left:50%;top:29%" aria-hidden="true"></span>
              <div class="hoops-map-ph-card">
                <p class="hoops-map-note">Beim Laden der Karte erhält der Kartendienst deine IP-Adresse.</p>
                <button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md hoops-map-load">Karte laden</button>
              </div>
            </div>
            <div class="hoops-map-status" role="status"></div>
            <p class="hoops-map-attr"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap-Mitwirkende</a></p>
          </div>
        </div>
        <div class="hoops-map-text is-quiet" id="halle-karte-text" tabindex="-1">
          <ol class="hoops-map-list" aria-label="Orte auf der Karte">
            <li class="hoops-map-item">
              <div class="hoops-map-item-body">
                <p class="hoops-map-name"><span>Sporthalle Nordhain</span></p>
                <p class="hoops-map-coords">49,3000° N, 7,9000° O</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
      <div class="hoops-venue-maplinks">
        <a class="hoops-link" href="https://www.openstreetmap.org/?mlat=49.3&amp;mlon=7.9#map=17/49.3/7.9">Größere Karte<span class="hoops-sr-only">, Sporthalle Nordhain</span></a>
        <a class="hoops-link" href="https://www.openstreetmap.org/directions?route=%3B49.3%2C7.9">Route planen<span class="hoops-sr-only">, Sporthalle Nordhain</span></a>
      </div>
    </div>
    <div class="hoops-venue-body">
      <h3 class="hoops-venue-title">Sporthalle Nordhain</h3>
      <address class="hoops-venue-address">
        <span class="hoops-venue-line">Am Sportpark 4</span>
        <span class="hoops-venue-line">12345 Nordhain</span>
      </address>
      <p class="hoops-venue-info">Zwei Spielfelder, Zugang über den Haupteingang.</p>
      <dl class="hoops-venue-contact">
        <div><dt>Kontakt</dt><dd>Jonas Weide</dd></div>
        <div><dt>Telefon</dt><dd><a class="hoops-link" href="tel:03023125100">030 23125 100</a></dd></div>
        <div><dt>E-Mail</dt><dd><a class="hoops-link" href="mailto:hallenwart@example.org">hallenwart@example.org</a></dd></div>
      </dl>
      <div class="hoops-venue-games">
        <div class="hoops-venue-sec" aria-hidden="true">Nächste Spiele in der Halle</div>
        <ul class="hoops-venue-game-list" aria-label="Nächste Spiele in der Halle">
          <li class="hoops-venue-game">
            <div class="hoops-venue-game-head"><span class="hoops-venue-when">Sa, 17.10.2026 · 17:30</span></div>
            <div class="hoops-venue-game-meta">Oberliga Nordhain Männer</div>
            <div class="hoops-venue-teams">
              <div class="hoops-venue-team">
                <span class="hoops-venue-dot hoops-venue-dot--heim" aria-hidden="true"></span>
                <span class="hoops-sr-only">Heim:</span>
                <span class="hoops-venue-team-name">TSV Nordhain 1920</span>
              </div>
              <div class="hoops-venue-team">
                <span class="hoops-venue-dot hoops-venue-dot--gast" aria-hidden="true"></span>
                <span class="hoops-sr-only">Gast:</span>
                <span class="hoops-venue-team-name">BG Seeberg</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div class="hoops-venue-foot">
        <a class="hoops-link hoops-venue-more" href="/hallen/nordhain">Zur Hallenseite<span class="hoops-sr-only">, Sporthalle Nordhain</span></a>
      </div>
    </div>
  </div>
</div>`;

const gamesJs = `{
      id: 'spiel-1', state: 'scheduled', date: 'Sa, 17.10.2026', time: '17:30', league: { name: 'Oberliga Nordhain Männer' },
      heim: { name: 'TSV Nordhain 1920', short: 'Nordhain' }, gast: { name: 'BG Seeberg', short: 'Seeberg' },
    },
    {
      id: 'spiel-2', state: 'scheduled', date: 'So, 18.10.2026', time: '14:00', league: { name: 'Landesliga Ost' },
      heim: { name: 'Lindenberg Hawks', short: 'Hawks' }, gast: { name: 'TSV Elbach', short: 'Elbach' },
    }`;

export const svelte = `<script>
  import VenueCard from '@hoopsfoundry/ui/svelte/VenueCard';

  // Die Karte lädt Kacheln erst nach „Karte laden“. tileUrl zeigt auf den eigenen Proxy (siehe Seite Map);
  // in Svelte als Konstante, weil {z} in einem Attribut ein Ausdruck wäre.
  const tileUrl = '/tiles/{z}/{x}/{y}.png';

  const games = [
    ${gamesJs},
  ];
</script>

<!-- Standard: Karte links, Daten rechts. Ohne lat/lng keine Karte; ohne games, contact, info oder href entfallen die Blöcke. -->
<VenueCard
  name="Sporthalle Nordhain"
  address={{ street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }}
  lat={49.3}
  lng={7.9}
  info="Zwei Spielfelder, Zugang über den Haupteingang."
  contact={{ name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' }}
  {games}
  logos
  names="short"
  href="/hallen/nordhain"
  {tileUrl}
/>

<!-- Seitenleiste: size="compact" (kleinere Karte, ohne Spiele), Ebene: titleAs 'h2' bis 'h6' -->
<VenueCard name="Mehrzweckhalle Seeberg" address={{ street: 'Seeweg 12', zip: '12346', city: 'Seeberg' }} lat={49.3055} lng={7.912} size="compact" titleAs="h2" {tileUrl} />

<!-- Mit Einwilligung oder eigenem Proxy: sofort laden (load="auto") und einen eigenen Hinweis -->
<VenueCard name="Gymnasium Kiefernau" lat={49.2955} lng={7.8905} load="auto" privacyNote="Die Karte wird über unseren Server geladen." {tileUrl} />`;

export const react = `import { VenueCard, type ScheduleGame, type VenueAddress, type VenueContact } from '@hoopsfoundry/ui/react';

// Die Karte lädt Kacheln erst nach „Karte laden“. tileUrl zeigt auf den eigenen Proxy (siehe Seite Map).
const tileUrl = '/tiles/{z}/{x}/{y}.png';

const address: VenueAddress = { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' };
const contact: VenueContact = { name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' };
const games: ScheduleGame[] = [
  ${gamesJs.replace(/\n    /g, '\n  ')},
];

{/* Standard: Karte links, Daten rechts. Ohne lat/lng keine Karte; ohne games, contact, info oder href entfallen die Blöcke. */}
<VenueCard
  name="Sporthalle Nordhain"
  address={address}
  lat={49.3}
  lng={7.9}
  info="Zwei Spielfelder, Zugang über den Haupteingang."
  contact={contact}
  games={games}
  logos
  names="short"
  href="/hallen/nordhain"
  tileUrl={tileUrl}
/>

{/* Seitenleiste: size="compact" (kleinere Karte, ohne Spiele), Ebene: titleAs 'h2' bis 'h6' */}
<VenueCard name="Mehrzweckhalle Seeberg" address={{ street: 'Seeweg 12', zip: '12346', city: 'Seeberg' }} lat={49.3055} lng={7.912} size="compact" titleAs="h2" tileUrl={tileUrl} />

{/* Mit Einwilligung oder eigenem Proxy: sofort laden (load="auto") und einen eigenen Hinweis */}
<VenueCard name="Gymnasium Kiefernau" lat={49.2955} lng={7.8905} load="auto" privacyNote="Die Karte wird über unseren Server geladen." tileUrl={tileUrl} />`;

export const ebeneSvelte = `<script>
  import HeadingLevel from '@hoopsfoundry/ui/svelte/HeadingLevel';
  import VenueCard from '@hoopsfoundry/ui/svelte/VenueCard';
</script>

<!-- Unter einer h2 der Seite: die Hallenkarte bekommt h3 (Standard) bzw. die Ebene aus HeadingLevel; titleAs gewinnt -->
<h2>Hallen</h2>
<HeadingLevel level={4}>
  <VenueCard name="Sporthalle Nordhain" />
  <VenueCard name="Mehrzweckhalle Seeberg" titleAs="h5" />
</HeadingLevel>`;

export const ebeneReact = `import { HeadingLevel, VenueCard } from '@hoopsfoundry/ui/react';

{/* Unter einer h2 der Seite: die Hallenkarte bekommt h3 (Standard) bzw. die Ebene aus HeadingLevel; titleAs gewinnt */}
<h2>Hallen</h2>
<HeadingLevel level={4}>
  <VenueCard name="Sporthalle Nordhain" />
  <VenueCard name="Mehrzweckhalle Seeberg" titleAs="h5" />
</HeadingLevel>`;

export const funktionenJs = `import { addressLines, contactInfo, telHref, mailHref, venueGames, venueMapLinks } from '@hoopsfoundry/ui/venue.js';

addressLines({ street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }); // ['Am Sportpark 4', '12345 Nordhain']
telHref('+49 30 23125 100'); // 'tel:+493023125100' (nur Ziffern und ein führendes Plus)
telHref('nur vormittags'); // undefined (kein Link)
mailHref('hallenwart@example.org'); // 'mailto:hallenwart@example.org'
mailHref('hallenwart@example.org?bcc=x@example.org'); // undefined (Parameter sind nicht erlaubt)

contactInfo({ name: 'Jonas Weide', phone: '030 23125 100' }); // { name, phone: { text, href: 'tel:03023125100' }, email: undefined }

// Die nächsten Spiele: ohne beendete (finished) und spielfreie (bye), höchstens limit (Standard 2, höchstens 5)
const games = [
  { id: '1', state: 'finished', heim: { name: 'A' }, gast: { name: 'B' } },
  { id: '2', state: 'scheduled', heim: { name: 'C' }, gast: { name: 'D' } },
  { id: '3', state: 'scheduled', heim: { name: 'E' }, gast: { name: 'F' } },
  { id: '4', state: 'scheduled', heim: { name: 'G' }, gast: { name: 'H' } },
];
venueGames(games).map((game) => game.id); // ['2', '3']
venueGames(games, 5).map((game) => game.id); // ['2', '3', '4']

venueMapLinks({ lat: 49.3, lng: 7.9, name: 'Sporthalle Nordhain' }); // [{ kind: 'osm', ... }, { kind: 'route', ... }]`;
