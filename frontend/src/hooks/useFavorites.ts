import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'chargeease_favorites';
const CHANGE_EVENT = 'chargeease:favorites-changed';

function readFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* localStorage unavailable (private mode) — favourites stay in memory */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Favourites are stored in this browser rather than server-side: the demo
 * build has no persistent user store behind it. Every mounted consumer listens
 * for the same change event, so saving a station in the finder immediately
 * updates the details page and vice versa.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    const current = readFavorites();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
    writeFavorites(next);
    setFavorites(next);
    return next.includes(id);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    const next = readFavorites().filter((item) => item !== id);
    writeFavorites(next);
    setFavorites(next);
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
