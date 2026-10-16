import type { ReactNode } from 'react';

export type DosDontsPair = { title: string; doText: string; dontText: string; good: ReactNode; bad: ReactNode };

// React 18 kennt `inert` nicht als Prop, ein leerer String reicht als Attribut.
const INERT = { inert: '' } as Record<string, string>;

/** Beispielpaare "richtig / falsch". Falsche Beispiele sind nur Anschauung (inert). Nur Storybook-Doku. */
export function DosDonts({ pairs }: { pairs: DosDontsPair[] }) {
  return (
    <div className="hoops-dd">
      {pairs.map((p) => (
        <section key={p.title} className="hoops-dd-pair">
          <h3 className="hoops-dd-title">{p.title}</h3>
          <div className="hoops-dd-cols">
            <figure className="hoops-dd-col hoops-dd-do">
              <div className="hoops-dd-stage">{p.good}</div>
              <figcaption>
                <span className="hoops-dd-badge">✓ Do</span> {p.doText}
              </figcaption>
            </figure>
            <figure className="hoops-dd-col hoops-dd-dont">
              <div className="hoops-dd-stage" {...INERT}>
                {p.bad}
              </div>
              <figcaption>
                <span className="hoops-dd-badge">
                  ✗ Don't<span className="hoops-sr-only"> </span>
                  <span className="hoops-sr-only">Beispiel für falsche Verwendung</span>
                </span>{' '}
                {p.dontText}
              </figcaption>
            </figure>
          </div>
        </section>
      ))}
    </div>
  );
}
