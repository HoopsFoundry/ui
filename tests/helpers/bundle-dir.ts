// Zielordner des Test-Bündels (gebaut von tests/helpers/bundle-setup.ts); über process.cwd(), weil `new URL` unter jsdom abweicht
import { resolve } from 'node:path';

export const bundleDir = `${resolve(process.cwd(), 'tests/.bundle-tmp')}/`;
