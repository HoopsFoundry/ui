export const vanilla = `<link rel="stylesheet" href="css/components.css" />

<!-- Sprite einmal ins Dokument legen (direkt hinter <body>). Die <symbol>-Elemente stehen in
     icons/sprite.ts (Konstante SPRITE), alle 67 Symbole, hier gekürzt auf eines. -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-whistle" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">…</symbol>
  </defs>
</svg>

<!-- Dekorativ: der Text daneben trägt die Bedeutung -->
<span style="color: var(--hoops-fg)">
  <svg class="dss-icon" width="24" height="24" viewBox="0 0 24 24"
       role="presentation" aria-hidden="true" focusable="false"><use href="#i-whistle"></use></svg>
  Schiedsrichter
</span>

<!-- Beschriftet: das Icon steht allein -->
<svg class="dss-icon" width="24" height="24" viewBox="0 0 24 24"
     role="img" aria-label="Löschen" focusable="false">
  <title>Löschen</title>
  <use href="#i-trash"></use>
</svg>`;

export const svelte = `<script>
  import Icon from '@bbv/dss-design-system/svelte/Icon';
</script>

<!-- Der Sprite wird beim ersten Gebrauch automatisch ins Dokument eingefügt -->
<Icon name="whistle" />

<!-- Größe in Pixeln; die Farbe kommt vom umgebenden Text (currentColor) -->
<span style="color: var(--hoops-fg)">
  <Icon name="live" size={16} /> Live
</span>

<!-- Allein stehendes Icon braucht title -->
<Icon name="trash" title="Löschen" />`;

export const react = `import { Icon } from '@bbv/dss-design-system/react';

{/* Der Sprite wird beim ersten Gebrauch automatisch ins Dokument eingefügt */}
<Icon name="whistle" />

{/* Größe in Pixeln; die Farbe kommt vom umgebenden Text (currentColor) */}
<span style={{ color: 'var(--hoops-fg)' }}>
  <Icon name="live" size={16} /> Live
</span>

{/* Allein stehendes Icon braucht title */}
<Icon name="trash" title="Löschen" />`;
