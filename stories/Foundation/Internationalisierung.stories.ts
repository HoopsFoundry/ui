import InternationalisierungDemo from './InternationalisierungDemo.svelte';

export default {
  // Die Seite ist die MDX-Seite; die Stories sind darin eingebettet
  tags: ['!dev'],
  title: 'Foundation/Internationalisierung',
  component: InternationalisierungDemo,
  parameters: { layout: 'padded' },
};

const example = (name: string) => ({
  render: () => ({ Component: InternationalisierungDemo, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

// Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const SvelteSprache  = { ...example('svelte'), tags: ['!dev'] };
export const VanillaSprache = { ...example('vanilla'), tags: ['!dev'] };
export const EigeneTexte    = { ...example('texte'), tags: ['!dev'] };
