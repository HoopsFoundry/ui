import { useActiveFramework, type Framework } from './useActiveFramework';

const NAMES: Record<Framework, string> = { vanilla: 'Vanilla HTML', svelte: 'Svelte', react: 'React' };

/** Code-Beispiel in drei Fassungen; sichtbar ist die Fassung der Werkzeugleiste. Nur Storybook-Doku. */
export function FrameworkCode({ vanilla, svelte, react, label }: { vanilla?: string; svelte?: string; react?: string; label?: string }) {
  const fw = useActiveFramework();
  const code = { vanilla, svelte, react }[fw];
  const name = NAMES[fw];
  return (
    <div className="hoops-doc-code-wrap">
      {label && <div className="hoops-doc-cap">{label}</div>}
      <div className="hoops-doc-code" tabIndex={0} role="region" aria-label={label ? `${label}, ${name}` : `Code-Beispiel ${name}`}>
        <span className="hoops-doc-chip">{name}</span>
        {code ? <pre>{code}</pre> : <p>Für diese Fassung gibt es hier kein Beispiel.</p>}
      </div>
    </div>
  );
}
