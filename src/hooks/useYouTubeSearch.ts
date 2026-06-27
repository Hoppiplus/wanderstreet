'use client';

import { useState, useCallback } from 'react';
import type { VideoResult, PovType, TimeOfDay } from '@/lib/types';

interface SearchOptions {
  lat: number;
  lng: number;
  label?: string; // reverse-geocoded place name — used to build a tight search query
  radiusMeters: number;
  pov: PovType;
  time: TimeOfDay;
}

interface UseYouTubeSearchReturn {
  videos: VideoResult[];
  loading: boolean;
  error: string | null;
  search: (opts: SearchOptions) => Promise<void>;
  clear: () => void;
}

export function useYouTubeSearch(): UseYouTubeSearchReturn {
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (opts: SearchOptions) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: String(opts.lat),
      lng: String(opts.lng),
      radius: String(opts.radiusMeters),
      pov: opts.pov,
      time: opts.time,
      ...(opts.label ? { label: opts.label } : {}),
    });

    try {
      const res = await fetch(`/api/youtube?${params}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Search failed');
      }
      setVideos(data.items ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setVideos([]);
    setError(null);
  }, []);

  return { videos, loading, error, search, clear };
}
