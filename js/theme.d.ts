import type { DssHandle } from './lifecycle.js';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeState = 'light' | 'dark';

export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ThemeOptions {
  /** Modus ohne gemerkte Wahl (Standard `system`); derselbe Wert wie bei `themeBootScript`: gemerkte Wahl vor `defaultMode` vor `system`. */
  defaultMode?: ThemeMode;
  /** Schlüssel im Speicher (Standard `dss-theme`). */
  storageKey?: string;
  /** Speicher (Standard `localStorage`); `null` schaltet das Merken ab. */
  storage?: ThemeStorage | null;
  /** Anfangsmodus; sonst der gemerkte, sonst `system`. */
  mode?: ThemeMode;
  /** Element, das das Attribut bekommt (Standard `<html>`: die Tokens reagieren nur dort). */
  target?: Element;
  /** Name des Attributs (Standard `data-theme`). */
  attribute?: string;
  /** Beschriftung des Buttons, wenn er keinen eigenen Text hat (Standard „Dunkelmodus“). */
  label?: string;
  /** Wird nach jeder Änderung aufgerufen (Klick, `setMode`, Änderung der Systemeinstellung im Modus `system`). */
  onChange?: (mode: ThemeMode, theme: ThemeState) => void;
}

export interface ThemeHandle extends DssHandle {
  getMode(): ThemeMode;
  setMode(mode: ThemeMode): void;
}

export interface ThemeBootOptions {
  storageKey?: string;
  attribute?: string;
  /** Wert ohne gemerkte Wahl (Standard `system`: kein Attribut). */
  defaultMode?: ThemeMode;
}

export const THEME_KEY: string;
export const THEME_ATTRIBUTE: string;
export const THEME_LABEL: string;
export function parseTheme(value: unknown): ThemeMode | null;
export function resolveTheme(mode: unknown, prefersDark: boolean): ThemeState;
export function nextTheme(mode: unknown, prefersDark: boolean): ThemeState;
export function readTheme(storage: ThemeStorage | null | undefined, key?: string): ThemeMode | null;
/** `keepSystem`: `system` wird gemerkt statt den Eintrag zu löschen (nötig, wenn `defaultMode` nicht `system` ist). */
export function writeTheme(storage: ThemeStorage | null | undefined, mode: ThemeMode, key?: string, keepSystem?: boolean): boolean;
/** Macht einen Button zum Umschalter (hell, dunkel, System); feste Beschriftung, `aria-pressed`, Symbole über `data-theme-state`. */
export function initTheme(button: HTMLElement, options?: ThemeOptions): ThemeHandle;
/** Inline-Code für den `<head>` gegen Flackern; mit Content-Security-Policy braucht er ein `nonce` oder einen Hash. */
export function themeBootScript(options?: ThemeBootOptions): string;
