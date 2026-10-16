/**
 * HoopsFoundry UI Icon-Sprite · gemeinsame Quelle für svelte/Icon.svelte und react/Icon.tsx.
 * Namen und Symbole stammen 1:1 aus der Icons-Spec (Entwurf Icons.html in docs/entwuerfe).
 */
export const ICON_NAMES = [
    // Spielaktionen (13)
    '2p', '3p', 'ft', 'foul-p', 'foul-t', 'foul-u', 'foul-d',
    'rebound', 'assist', 'steal', 'block', 'turnover', 'sub',
    // Court (6)
    'hoop', 'backboard', 'zone', '3line', 'center', 'shotclock',
    // Rollen (5)
    'whistle', 'scorer', 'coach', 'captain', 'dnp',
    // Status (6)
    'live', 'timeout', 'half', 'dq', 'foulout', 'bonus',
    // System (7)
    'sync', 'offline', 'valid', 'print', 'signature', 'cloud', 'lock',
    // UI-Core (selection from the 30-icon set)
    'home', 'search', 'bell', 'cog', 'plus', 'minus', 'check', 'x',
    'chevron-r', 'chevron-d', 'chevron-l', 'chevron-u', 'arr-r',
    'calendar', 'roster', 'stats', 'trophy', 'folder', 'edit', 'trash',
    'filter', 'sort', 'export', 'import', 'share', 'menu', 'more-h',
    'question', 'info', 'warn',
  ] as const;

export type IconName = typeof ICON_NAMES[number];

export const SPRITE_ID = 'hoops-icon-sprite';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Der Sprite als SVG-Quelltext (ohne Namespace, siehe parseSprite). */
export const SPRITE = `<svg width="0" height="0"><defs>
<symbol id="i-2p" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 20h11"/><path d="M6.5 17.5h11"/><path d="M8 20v-1.5M16 20v-1.5"/><path d="M12 4v9"/><path d="M8 9l4-4 4 4"/><text x="12" y="11" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="9" fill="currentColor" stroke="none">2</text></symbol>
<symbol id="i-3p" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 20h11"/><path d="M6.5 17.5h11"/><path d="M8 20v-1.5M16 20v-1.5"/><path d="M12 4v9"/><path d="M8 9l4-4 4 4"/><text x="12" y="11" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="9" fill="currentColor" stroke="none">3</text></symbol>
<symbol id="i-ft" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19h14"/><path d="M5 17h14"/><path d="M6.5 19v-1.5M17.5 19v-1.5"/><circle cx="12" cy="7" r="2.5"/><path d="M12 9.5v3.5"/><path d="M9.5 13.5h5"/></symbol>
<symbol id="i-foul-p" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="15.5" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="10.5" fill="currentColor" stroke="none">P</text></symbol>
<symbol id="i-foul-t" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="15.5" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="10.5" fill="currentColor" stroke="none">T</text></symbol>
<symbol id="i-foul-u" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="15.5" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="10.5" fill="currentColor" stroke="none">U</text></symbol>
<symbol id="i-foul-d" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="9"/><text x="12" y="15.5" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="10.5" fill="#fff" stroke="none">D</text></symbol>
<symbol id="i-rebound" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 7.5V4M16.5 12H20M12 16.5V20M7.5 12H4"/><path d="M9.4 9.4 7 7M16.6 9.4 19 7M9.4 14.6 7 17M16.6 14.6 19 17"/></symbol>
<symbol id="i-assist" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="12" r="4"/><path d="M17 9v6M14 12h6"/><path d="M3 17 11 11"/><path d="M3 17v-3M3 17h3"/></symbol>
<symbol id="i-steal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13V8a1.5 1.5 0 0 1 3 0v4"/><path d="M8 11V6a1.5 1.5 0 0 1 3 0v6"/><path d="M11 11V7a1.5 1.5 0 0 1 3 0v6"/><path d="M14 9.5a1.5 1.5 0 0 1 3 0V15a5 5 0 0 1-10 0v-2"/><path d="M20 7 16 11"/><path d="M20 7v-3M20 7h3" opacity=".6"/></symbol>
<symbol id="i-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 7c0-1.1-.9-2-2-2s-2 .9-2 2v6"/><path d="M10 9c0-1.1-.9-2-2-2s-2 .9-2 2v5"/><path d="M6 11c0-1.1-.9-2-2-2v6a6 6 0 0 0 12 0V8a2 2 0 1 0-4 0"/><path d="M20 5l-4 4M16 5l4 4" stroke-width="2"/></symbol>
<symbol id="i-turnover" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h11a3 3 0 0 1 0 6H10"/><path d="M14 16 10 13l4-3"/><path d="M19 17H8a3 3 0 0 1 0-6h6" opacity=".5"/></symbol>
<symbol id="i-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4v16M8 4 5 7M8 4l3 3"/><path d="M16 20V4M16 20l-3-3M16 20l3-3"/></symbol>
<symbol id="i-hoop" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="9.5" rx="7" ry="2"/><path d="M6.5 10c0 1.5.5 4 1 6.5M17.5 10c0 1.5-.5 4-1 6.5"/><path d="M9 9.7c.5 2 1 5 1.5 7M15 9.7c-.5 2-1 5-1.5 7"/><path d="M11.5 16.5h1"/></symbol>
<symbol id="i-backboard" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="11" rx="1"/><rect x="9.5" y="9" width="5" height="4"/><path d="M9.5 17.5h5"/><path d="M11 15v2.5"/></symbol>
<symbol id="i-zone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v8a5 5 0 0 1-10 0V4Z"/><path d="M7 9h10"/><circle cx="12" cy="17" r="2.5" opacity=".55"/></symbol>
<symbol id="i-3line" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 19V5h17v14"/><path d="M3.5 19c5-1 6-10 8.5-10s3.5 9 8.5 10"/><circle cx="12" cy="6" r="1" fill="currentColor"/></symbol>
<symbol id="i-center" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M3.5 12h17"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-shotclock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><text x="12" y="15" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="7.5" fill="currentColor" stroke="none">24</text><path d="M9 3.5v2M15 3.5v2"/></symbol>
<symbol id="i-whistle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9.5 14 12l-1.6-4.4a1 1 0 0 1 .59-1.28l5.7-1.9a1 1 0 0 1 1.3.85L21 9.5Z"/><circle cx="9" cy="14.5" r="5.5"/><path d="M9 14.5h2"/></symbol>
<symbol id="i-scorer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5h6v2H9z" fill="currentColor" stroke="none"/><path d="M8 11h8M8 14h8M8 17h5"/></symbol>
<symbol id="i-coach" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5h6v2H9z" fill="currentColor" stroke="none"/><path d="m8.5 11 2 2M10.5 11l-2 2"/><circle cx="14.5" cy="12" r="1.75"/><path d="M8.5 16.5l2 2M10.5 16.5l-2 2" opacity=".5"/><circle cx="14.5" cy="17.5" r="1.75" opacity=".5"/></symbol>
<symbol id="i-captain" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.3 7.5 8 9 4.7-1.5 8-4.5 8-9V6l-8-3Z"/><text x="12" y="15" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="9" fill="currentColor" stroke="none">C</text></symbol>
<symbol id="i-dnp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M6.5 6.5l11 11" stroke-width="2"/></symbol>
<symbol id="i-live" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10"/><path d="M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16" opacity=".55"/></symbol>
<symbol id="i-timeout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M6.5 8.5h11M12 8.5v9"/></symbol>
<symbol id="i-half" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" opacity=".15"/></symbol>
<symbol id="i-dq" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></symbol>
<symbol id="i-foulout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="9.5" cy="12" r="1.6" fill="currentColor"/><circle cx="14" cy="12" r="1.6" fill="currentColor"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor"/><path d="M2 18l20-12" stroke-width="2"/></symbol>
<symbol id="i-bonus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v17M5 4l4 1 4-1 4 1 4-1v8l-4 1-4-1-4 1-4-1"/><text x="12" y="11" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="7" fill="currentColor" stroke="none">+</text></symbol>
<symbol id="i-sync" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a8 8 0 0 1 14-5"/><path d="M18 3v4h-4"/><path d="M20 13a8 8 0 0 1-14 5"/><path d="M6 21v-4h4"/></symbol>
<symbol id="i-offline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11a4 4 0 0 1 4-4 5 5 0 0 1 4.7 3.2A3.5 3.5 0 0 1 18.5 17H7a3 3 0 0 1-2-5.7Z" opacity=".55"/><path d="M3 3l18 18" stroke-width="2.2"/></symbol>
<symbol id="i-valid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m7.5 12.5 3 3 6-7" stroke-width="2"/></symbol>
<symbol id="i-print" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V4h10v5"/><path d="M7 18H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6" rx="1"/></symbol>
<symbol id="i-signature" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c2-.5 3.5-1.5 4-3s-.5-3.5-2-3-1.5 4 0 6 4 1.5 6-1 1-5 2.5-4 1 4 2.5 4 3-2 4.5-2"/><path d="M3 21h18"/></symbol>
<symbol id="i-cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a4 4 0 0 1 4-7 5 5 0 0 1 4.7 3.2A3.5 3.5 0 0 1 18 19H7a3 3 0 0 1-2-2Z"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></symbol>
<symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></symbol>
<symbol id="i-cog" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="m19.5 12 1.4-1.4-1.5-2.6-1.9.5-1.6-.9-.5-1.9h-3l-.5 1.9-1.6.9-1.9-.5-1.5 2.6L8.5 12l-1.4 1.4 1.5 2.6 1.9-.5 1.6.9.5 1.9h3l.5-1.9 1.6-.9 1.9.5 1.5-2.6L19.5 12Z"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 6 12 12M18 6 6 18"/></symbol>
<symbol id="i-chevron-r" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></symbol>
<symbol id="i-chevron-d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="i-chevron-l" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></symbol>
<symbol id="i-chevron-u" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></symbol>
<symbol id="i-arr-r" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></symbol>
<symbol id="i-roster" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3.25"/><path d="M3.5 19c.7-3.2 2.9-5 5.5-5s4.8 1.8 5.5 5"/><path d="M16 6.5a3 3 0 0 1 0 5.5"/><path d="M17.5 19c-.4-2.1-1.6-3.7-3-4.5"/></symbol>
<symbol id="i-stats" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20V4"/><path d="M3.5 20h17"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="14" width="3" height="3"/></symbol>
<symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/><path d="M10 14v3h4v-3M8 20h8"/></symbol>
<symbol id="i-folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18V6.5Z"/></symbol>
<symbol id="i-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13 6 4 4"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5h15M9 6.5V4h6v2.5"/><path d="M6.5 6.5 7 20a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 20l.5-13.5"/><path d="M10 10v8M14 10v8"/></symbol>
<symbol id="i-filter" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5h17l-6.5 8v6l-4-2v-4Z"/></symbol>
<symbol id="i-sort" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 20V4M13 16l4 4 4-4"/></symbol>
<symbol id="i-export" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></symbol>
<symbol id="i-import" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M8 11l4 4 4-4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></symbol>
<symbol id="i-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 11 7.6-4M8.2 13l7.6 4"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-more-h" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="18" cy="12" r="1.75"/></symbol>
<symbol id="i-question" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.6-2.5 2-2.5 3.5"/><circle cx="12" cy="16.5" r=".6" fill="currentColor"/></symbol>
<symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v6"/><circle cx="12" cy="8" r=".6" fill="currentColor"/></symbol>
<symbol id="i-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4 10 17H2L12 4Z"/><path d="M12 10v5"/><circle cx="12" cy="18.2" r=".6" fill="currentColor"/></symbol>
</defs></svg>`;

/** Parst den Sprite zu einem SVG-Element (kein HTML-String-Einfügen, kaputtes XML fällt im Test auf). */
export function parseSprite(): SVGElement {
  const xml = SPRITE.replace('<svg ', `<svg xmlns="${SVG_NS}" `);
  const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
  return doc.documentElement as unknown as SVGElement;
}
