'use client';
import { useEffect, useState } from 'react';

const KEY = 'neardrop-dark';

function getInitial(): boolean {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored !== null) return stored === '1';
  } catch { /* ignore */ }
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function useDarkMode() {
  const [dark, setDark] = useState(false); // start false to avoid hydration mismatch

  useEffect(() => {
    setDark(getInitial());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try { localStorage.setItem(KEY, dark ? '1' : '0'); } catch { /* ignore */ }
  }, [dark]);

  const toggle = () => setDark(d => !d);
  return { dark, toggle };
}
