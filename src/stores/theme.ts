import { atom } from 'nanostores';

export type Theme = 'day' | 'night';

const STORAGE_KEY = 'theme';

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'day';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'night' ? 'night' : 'day';
}

export const $theme = atom<Theme>(readInitial());

if (typeof window !== 'undefined') {
  $theme.subscribe((theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  });
}

export function setTheme(next: Theme): void {
  $theme.set(next);
}

export function toggleTheme(): void {
  $theme.set($theme.get() === 'day' ? 'night' : 'day');
}
