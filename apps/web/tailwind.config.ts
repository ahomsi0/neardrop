// Tailwind v4: most config lives in globals.css via @theme.
// This file is kept for tooling compatibility only.
import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
};
export default config;
