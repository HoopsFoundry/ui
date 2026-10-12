import DarkModeDemo from './DarkModeDemo.svelte';

export default {
  // Die Seite ist die MDX-Seite; die Stories sind darin eingebettet
  tags: ['!dev'],
  title: 'Foundation/Dark Mode',
  component: DarkModeDemo,
  parameters: { layout: 'padded' },
};

const example = (name: string) => ({
  render: () => ({ Component: DarkModeDemo, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Demo        = { ...example('demo'), tags: ['!dev'] };
export const VanillaKnopf = { ...example('vanilla'), tags: ['!dev'] };
export const Zustaende   = { ...example('zustaende'), tags: ['!dev'] };
export const Handy       = { ...example('handy'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const HandyDunkel = { ...example('handy-dunkel'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoName     = { ...example('do-name'), tags: ['!dev'] };
export const DontName   = { ...example('dont-name'), tags: ['!dev'] };
export const DoSymbol   = { ...example('do-symbol'), tags: ['!dev'] };
export const DontSymbol = { ...example('dont-symbol'), tags: ['!dev'] };
export const DoToken    = { ...example('do-token'), tags: ['!dev'] };
export const DontToken  = { ...example('dont-token'), tags: ['!dev'] };
