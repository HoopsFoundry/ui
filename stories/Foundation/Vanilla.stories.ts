import VanillaDemo from './VanillaDemo.svelte';

export default {
  // Die Seite ist die MDX-Seite; die Stories sind darin eingebettet
  tags: ['!dev'],
  title: 'Foundation/Vanilla',
  component: VanillaDemo,
  parameters: { layout: 'padded' },
};

const example = (name: string) => ({
  render: () => ({ Component: VanillaDemo, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Seite       = { ...example('seite'), tags: ['!dev'] };
export const Handy       = { ...example('handy'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const HandyAccordion = { ...example('handy-accordion'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

export const Markup           = { ...example('markup'), tags: ['!dev'] };
export const MarkupHandy      = { ...example('markup-handy'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const MarkupHandyTeam = { ...example('markup-handy-team'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoRender    = { ...example('do-render'), tags: ['!dev'] };
export const DontRender  = { ...example('dont-render'), tags: ['!dev'] };
export const DoText      = { ...example('do-text'), tags: ['!dev'] };
export const DontText    = { ...example('dont-text'), tags: ['!dev'] };
export const DoBoot      = { ...example('do-boot'), tags: ['!dev'] };
export const DontBoot    = { ...example('dont-boot'), tags: ['!dev'] };
export const DoKopie     = { ...example('do-kopie'), tags: ['!dev'] };
export const DontKopie   = { ...example('dont-kopie'), tags: ['!dev'] };
