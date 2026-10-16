/** Code-Beispiel in genau einer Sprache (nginx, TypeScript, JavaScript), unabhängig vom Umschalter „Fassung“. Nur Storybook-Doku. */
export function CodeBlock({ code, language, label }: { code: string; language: string; label: string }) {
  return (
    <div className="hoops-doc-code-wrap">
      <div className="hoops-doc-cap">{label}</div>
      <div className="hoops-doc-code" tabIndex={0} role="region" aria-label={`${label}, ${language}`}>
        <span className="hoops-doc-chip">{language}</span>
        <pre>{code}</pre>
      </div>
    </div>
  );
}
