/** Code-Beispiel in genau einer Sprache (nginx, TypeScript, JavaScript), unabhängig vom Umschalter „Fassung“. Nur Storybook-Doku. */
export function CodeBlock({ code, language, label }: { code: string; language: string; label: string }) {
  return (
    <div className="dss-doc-code-wrap">
      <div className="dss-doc-cap">{label}</div>
      <div className="dss-doc-code" tabIndex={0} role="region" aria-label={`${label}, ${language}`}>
        <span className="dss-doc-chip">{language}</span>
        <pre>{code}</pre>
      </div>
    </div>
  );
}
