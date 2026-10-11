import SpielplanExamples from './components/SpielplanExamples.svelte';

// Beispiele für die Doku-Seite (Spielplan.mdx). Nicht in der Seitenleiste: tags auf Meta-Ebene gelten für alle Stories.
export default {
  title: 'Components/Spielplan',
  component: SpielplanExamples,
  tags: ['!dev'],
  parameters: { controls: { disable: true }, layout: 'padded' },
};

const example = (name: string) => ({ render: () => ({ Component: SpielplanExamples, props: { example: name } }) });

export const MiniLiga = example('mini-liga');
export const MiniMannschaft = example('mini-mannschaft');
export const MiniTurnier = example('mini-turnier');
export const MiniRaster = example('mini-raster');

export const Einklappbar = example('einklappbar');
export const EinklappbarId = example('einklappbar-id');
export const EinklappbarGruppe = example('einklappbar-gruppe');
export const DoOffen = example('do-offen');
export const DontZu = example('dont-zu');

export const LayoutOpponent = example('layout-opponent');
export const LayoutVersus = example('layout-versus');
export const LayoutColumns = example('layout-columns');

export const Raster3 = example('raster-3');
export const Raster5 = example('raster-5');

export const ZustandScheduled = example('zustand-scheduled');
export const ZustandLive = example('zustand-live');
export const ZustandFinished = example('zustand-finished');
export const ZustandProvisional = example('zustand-provisional');
export const ZustandRaster = example('zustand-raster');
export const ZustandCancelled = example('zustand-cancelled');
export const ZustandPostponed = example('zustand-postponed');
export const ZustandBye = example('zustand-bye');
export const ZustandOwn = example('zustand-own');
export const ZustandPlaceholder = example('zustand-placeholder');
export const ZustandWin = example('zustand-win');
export const ZustandLoss = example('zustand-loss');
export const ZustandDraw = example('zustand-draw');
export const ZustandForfeit = example('zustand-forfeit');
export const ZustandNotice = example('zustand-notice');
export const ZustandTime = example('zustand-time');

export const DichteTouch = example('dichte-touch');
export const DichteDefault = example('dichte-default');
export const DichteCompact = example('dichte-compact');
export const DichteVorlaeufig = example('dichte-vorlaeufig');

export const NamenVoll = example('namen-voll');
export const NamenKurz = example('namen-kurz');
export const LogosVersus = example('logos-versus');
export const LogosVersusKurz = example('logos-versus-kurz');
export const LogosColumns = example('logos-columns');
export const LogosOpponent = example('logos-opponent');
export const LogosOpponentAus = example('logos-opponent-aus');
export const LogosRaster = example('logos-raster');
export const LogosTouch = example('logos-touch');
export const LogosDefault = example('logos-default');
export const LogosCompact = example('logos-compact');
export const NamenHandy = example('namen-handy');

export const DoKurz = example('do-kurz');
export const DontKurz = example('dont-kurz');
export const DoLogo = example('do-logo');
export const DontLogo = example('dont-logo');

export const DoDichte = example('do-dichte');
export const DontDichte = example('dont-dichte');
export const DoAbsage = example('do-absage');
export const DontAbsage = example('dont-absage');
export const DoHallen = example('do-hallen');
export const DontHallen = example('dont-hallen');
export const DoEigene = example('do-eigene');
export const DontEigene = example('dont-eigene');
