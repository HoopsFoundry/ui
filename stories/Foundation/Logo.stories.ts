import Logo from './Logo.svelte';

export default {
  // Die Seite ist die MDX-Seite; die Stories sind darin eingebettet
  tags: ['!dev'],
  title: 'Foundation/Logo',
  component: Logo,
  parameters: { layout: 'padded', controls: { disable: true } },
};

// Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const Varianten = { args: { mode: 'varianten' }, tags: ['!dev'] };
export const Groessen = { args: { mode: 'groessen' }, tags: ['!dev'] };
export const Schutzraum = { args: { mode: 'schutzraum' }, tags: ['!dev'] };
export const Footer = { args: { mode: 'footer' }, tags: ['!dev'] };
