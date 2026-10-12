# DSS-Architektur

Die Architekturquelle ist modulares AsciiDoc. Einstieg: [index.adoc](index.adoc).

## Kapitel

1. [Einführung und Ziele](sections/01-introduction-and-goals.adoc)
2. [Randbedingungen](sections/02-constraints.adoc)
3. [Kontext und Abgrenzung](sections/03-context-and-scope.adoc)
4. [Lösungsstrategie](sections/04-solution-strategy.adoc)
5. [Bausteinsicht](sections/05-building-block-view.adoc)
6. [Laufzeitsicht](sections/06-runtime-view.adoc)
7. [Verteilungssicht](sections/07-deployment-view.adoc)
8. [Querschnittliche Konzepte](sections/08-crosscutting-concepts.adoc)
9. [Architekturentscheidungen](sections/09-architecture-decisions.adoc)
10. [Qualitätsanforderungen](sections/10-quality-requirements.adoc)
11. [Risiken und technische Schulden](sections/11-risks-and-technical-debt.adoc)
12. [Glossar](sections/12-glossary.adoc)

## Quellen und Grenzen

Baseline: Repository-Prüfung und Superpowers-Pläne vom 12. Oktober 2026. Diese erste Fassung ist kein vollständiger Code-Audit und kein Testnachweis. Planstände können dem Implementierungsstand hinterherlaufen.

Storybook dokumentiert die Komponentenverwendung. Superpowers dokumentiert Entwürfe und Umsetzungspakete. Diese Architektur beschreibt deren Zusammenhang und trennt Ist-Zustand, beschlossene Planung und offene Vorschläge.

## Noch ausstehend

- Prüfung der Kapitel gegen die vollständigen Implementierungen.
- Mermaid-Diagramme für Kontext, Bausteine und Lifecycle.
- Eigenständige ADRs mit Quellen und Status.
- Gepinnter HTML-Build und Dokumentationsprüfung in CI.

GitHub stellt Kapitel einzeln dar; die Zusammenführung über Includes benötigt einen Asciidoctor-Build. In dieser Baseline werden keine neuen Build-Kommandos behauptet oder Abhängigkeiten verändert.
