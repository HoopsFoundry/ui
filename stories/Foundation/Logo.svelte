<script>
  import project from '../../project.config.json';
  // Projektadresse aus project.config.json (die eine Quelle)
  const projektUrl = `https://${project.domain}`;
  // Vorschauen der Logo-Seite. Bilder liegen über `staticDirs` (.storybook/main.ts) unter `logo/`, relativ zur Seite.
  let { mode = 'varianten' } = $props();

  const varianten = [
    { datei: 'logo-claim.svg', alt: 'HoopsFoundry mit Claim „Build for the love of the game“: Zeichen und „Hoops“ in Ash (dunkelgrau), „Foundry“ in Orangerot, Claim in Ash', hoehe: 56, dunkel: false },
    { datei: 'logo-claim-hell.svg', alt: 'HoopsFoundry mit Claim „Build for the love of the game“: Zeichen und „Hoops“ weiß, „Foundry“ in Orangerot, Claim hellgrau, für dunklen Grund', hoehe: 56, dunkel: true },
    { datei: 'logo-wortmarke.svg', alt: 'HoopsFoundry ohne Claim: Zeichen und „Hoops“ in Ash (dunkelgrau), „Foundry“ in Orangerot', hoehe: 40, dunkel: false },
    { datei: 'logo-wortmarke-hell.svg', alt: 'HoopsFoundry ohne Claim für dunklen Grund: Zeichen und „Hoops“ weiß, „Foundry“ in Orangerot', hoehe: 40, dunkel: true },
    { datei: 'logo-farbig.svg', alt: 'Marken-Zeichen: H mit Korb-Ring, Spieler in Ash und orangerotem F', hoehe: 112, dunkel: false },
    { datei: 'logo-farbig-dunkel.svg', alt: 'Marken-Zeichen für dunklen Grund: weiß mit orangerotem F', hoehe: 112, dunkel: true },
    { datei: 'logo-einfarbig.svg', alt: 'Marken-Zeichen einfarbig (currentColor), hier schwarz', hoehe: 112, dunkel: false },
    { datei: 'logo-app-icon.svg', alt: 'App-Icon: weißes Zeichen mit orangerotem F auf Ash-farbener abgerundeter Kachel', hoehe: 112, dunkel: false },
    { datei: 'logo-app-icon-dunkel.svg', alt: 'App-Icon für dunklen Grund, invertiert: Zeichen in Ash mit orangerotem F auf weißer abgerundeter Kachel', hoehe: 112, dunkel: true },
    { datei: 'logo-icon-farbig.svg', alt: 'Footer-Icon farbig: Zeichen in Ash mit orangerotem F', hoehe: 112, dunkel: false },
    { datei: 'logo-icon-farbig-dunkel.svg', alt: 'Footer-Icon farbig für dunklen Grund: weißes Zeichen mit orangerotem F', hoehe: 112, dunkel: true },
    { datei: 'logo-icon.svg', alt: 'Footer-Icon einfarbig (currentColor), hier schwarz', hoehe: 112, dunkel: false },
  ];
  const groessen = [16, 24, 32, 48];
</script>

{#if mode === 'varianten'}
  <ul class="logo-grid">
    {#each varianten as v}
      <li class="logo-cell">
        <div class="logo-stage" class:is-dunkel={v.dunkel}>
          <img src={`./logo/${v.datei}`} alt={v.alt} style={`height:${v.hoehe}px`} />
        </div>
        <code class="logo-name">{v.datei}</code>
      </li>
    {/each}
  </ul>
{:else if mode === 'groessen'}
  <ul class="logo-grid">
    {#each groessen as h}
      <li class="logo-cell">
        <div class="logo-stage">
          <img src="./logo/logo-icon-farbig.svg" alt={`Footer-Icon farbig, ${h} Pixel hoch`} style={`height:${h}px`} />
        </div>
        <span class="logo-name">{h} px hoch</span>
      </li>
    {/each}
    <li class="logo-cell">
      <div class="logo-stage">
        <img src="./logo/logo-claim.svg" alt="Logo mit Claim, 48 Pixel hoch (Mindestgröße)" style="height:48px" />
      </div>
      <span class="logo-name">Logo mit Claim, 48 px hoch</span>
    </li>
  </ul>
{:else if mode === 'schutzraum'}
  <div class="logo-stage logo-stage--schutz">
    <div class="logo-schutz" style="padding:24px">
      <img src="./logo/logo-farbig.svg" alt="Marken-Zeichen mit eingezeichnetem Schutzraum" style="height:96px" />
    </div>
  </div>
{:else if mode === 'footer'}
  <div class="logo-footers">
    <div class="logo-stage logo-stage--footer">
      <a class="logo-foot" href={projektUrl}>
        <img src="./logo/logo-icon-farbig.svg" alt="" width="16" height="23" />
        <span>Powered by HoopsFoundry UI</span>
      </a>
    </div>
    <div class="logo-stage logo-stage--seite">
      <a class="logo-foot logo-foot--seite" href={projektUrl}>
        <span class="logo-maske" style="-webkit-mask: url(./logo/logo-icon.svg) center / contain no-repeat; mask: url(./logo/logo-icon.svg) center / contain no-repeat" aria-hidden="true"></span>
        <span>Powered by HoopsFoundry UI</span>
      </a>
    </div>
    <div class="logo-stage logo-stage--footer is-dunkel">
      <a class="logo-foot" href={projektUrl}>
        <img src="./logo/logo-icon-farbig-dunkel.svg" alt="" width="16" height="23" />
        <span>Powered by HoopsFoundry UI</span>
      </a>
    </div>
    <div class="logo-stage logo-stage--footer">
      <a class="logo-foot logo-foot--allein" href={projektUrl}>
        <img src="./logo/logo-icon-farbig.svg" alt="HoopsFoundry UI" width="16" height="23" />
      </a>
    </div>
  </div>
{/if}

<style>
  .logo-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  .logo-cell { display: grid; gap: 6px; min-width: 0; }
  /* Feste Grundfarben: Die Logos sind Ash bzw. weiß und brauchen einen passenden Grund, egal in welchem Modus die Doku steht */
  .logo-stage { background: #fff; color: #000; border: 1px solid var(--hoops-page-line); border-radius: 12px; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 96px; }
  .logo-stage.is-dunkel { background: #000; color: #fff; }
  .logo-stage img { display: block; max-width: 100%; }
  .logo-name { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); color: var(--hoops-page-fg); overflow-wrap: anywhere; }
  .logo-stage--schutz { justify-content: flex-start; }
  .logo-schutz { outline: 2px dashed #6b6b6b; outline-offset: 0; background: repeating-linear-gradient(45deg, #fff, #fff 6px, #efefef 6px, #efefef 7px); display: inline-block; }
  .logo-schutz img { background: #fff; }
  .logo-footers { display: grid; gap: 12px; }
  .logo-stage--footer, .logo-stage--seite { justify-content: flex-start; }
  /* Die Maske steht im style-Attribut: Eine URL im Stylesheet löst sich gegen die CSS-Datei (assets/) auf, nicht gegen die Seite */
  /* Das einfarbige Icon übernimmt die Textfarbe der Seite (hell wie dunkel): Maske mit currentColor */
  .logo-stage--seite { background: var(--hoops-page-surface-0); color: var(--hoops-page-fg); }
  .logo-foot { display: inline-flex; align-items: center; gap: 8px; min-height: 24px; padding-block: 4px; color: inherit; font-size: var(--hoops-fs-body-md); }
  .logo-foot span:last-child { text-decoration: underline; }
  .logo-foot--allein { min-width: 24px; justify-content: center; padding: 4px; }
  .logo-foot:focus-visible { outline: var(--hoops-ring-w) var(--hoops-ring-style) var(--hoops-ring-color); outline-offset: 2px; }
  .logo-maske { display: inline-block; width: 16px; height: 23px; background: currentColor; }
</style>
