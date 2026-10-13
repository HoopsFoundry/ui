import type { HeadingTag } from '../heading.js';

/** Optionen, die alle `renderX`-Funktionen kennen. */
export interface RenderOptions {
  /** Basis für erzeugte ids (einklappbarer Rahmen, Karte). Ohne Angabe ein Hash über die Eingabe (gleiche Eingabe, gleiche ids). */
  uid?: string;
}

/** Eine Mannschaft aus geprüften Eingaben (intern geteilt von den Render-Funktionen). */
export interface RenderTeam {
  name: string;
  short: string | undefined;
  logo: string | undefined;
  href: string | undefined;
  placeholder: boolean;
  own: boolean;
  score: number | undefined;
}

export function obj(value: unknown): Record<string, unknown>;
export function list(value: unknown): unknown[];
export function str(value: unknown): string;
export function num(value: unknown): number | undefined;
export function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T;
export function url(value: unknown): string | undefined;
export function cls(...parts: unknown[]): string;
export function klass(...parts: unknown[]): string;
export function uidFor(seed: unknown, options?: RenderOptions): string;
export function headingOf(titleAs: unknown): HeadingTag;
export function teamOf(raw: unknown): RenderTeam;
export function nameText(team: { name: string; short?: string }, names: unknown, extra?: string): string;
export function logoBadge(team: { name: string; logo?: string }, extra?: string): string;
export function formChips(form: unknown, variant?: 'dots' | 'letters', className?: string): string;
export function liveTag(): string;
export function collapsibleFrame(input: {
  kind: 'frame' | 'league';
  rootClass: string;
  id?: string;
  title: string;
  sub?: string;
  titleAs?: unknown;
  open?: boolean;
  meta?: string;
  content: string;
  uid: string;
}): string;
