'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VideoResult } from '@/lib/types';

const STORAGE_KEY = 'wanderstreet_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<VideoResult[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: VideoResult[]) => {
    setFavorites(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const toggle = useCallback((video: VideoResult) => {
    setFavorites((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      const next = exists ? prev.filter((v) => v.id !== video.id) : [video, ...prev];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isFavorited = useCallback(
    (id: string) => favorites.some((v) => v.id === id),
    [favorites]
  );

  return { favorites, toggle, isFavorited };
}
