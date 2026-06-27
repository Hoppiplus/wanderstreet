'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { PovType, TimeOfDay, SearchState } from '@/lib/types';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';
import FilterBar from '@/components/FilterBar';
import VideoPanel from '@/components/VideoPanel';
import AmbientMixer from '@/components/AmbientMixer';
import SearchBar from '@/components/SearchBar';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  const [pov, setPov] = useState<PovType>('all');
  const [time, setTime] = useState<TimeOfDay>('all');
  const [radius, setRadius] = useState<number>(500);
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | undefined>(undefined);
  const initialLoadDone = useRef(false);

  const { videos, loading, error, search } = useYouTubeSearch();

  const buildShareUrl = useCallback((state: SearchState, p: PovType, t: TimeOfDay, r: number) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('lat', state.lat.toFixed(6));
    url.searchParams.set('lng', state.lng.toFixed(6));
    url.searchParams.set('label', state.label);
    url.searchParams.set('r', r.toString());
    url.searchParams.set('pov', p);
    url.searchParams.set('time', t);
    return url.toString();
  }, []);

  const handleLocationSelected = useCallback(
    (lat: number, lng: number, label: string) => {
      const state: SearchState = { lat, lng, label, radiusMeters: radius };
      setSearchState(state);
      setPanelOpen(true);
      search({ lat, lng, label, radiusMeters: radius, pov, time });
      setShareUrl(buildShareUrl(state, pov, time, radius));
    },
    [radius, pov, time, search, buildShareUrl]
  );

  // Write URL params whenever state changes
  useEffect(() => {
    if (!searchState) return;
    const url = new URL(window.location.href);
    url.searchParams.set('lat', searchState.lat.toFixed(6));
    url.searchParams.set('lng', searchState.lng.toFixed(6));
    url.searchParams.set('label', searchState.label);
    url.searchParams.set('r', radius.toString());
    url.searchParams.set('pov', pov);
    url.searchParams.set('time', time);
    window.history.replaceState({}, '', url.toString());
    setShareUrl(url.toString());
  }, [searchState, pov, time, radius]);

  // On mount: restore from URL params
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat') ?? '');
    const lng = parseFloat(params.get('lng') ?? '');
    const label = params.get('label') ?? '';
    const r = parseInt(params.get('r') ?? '500');
    const p = (params.get('pov') ?? 'all') as PovType;
    const t = (params.get('time') ?? 'all') as TimeOfDay;

    if (!isNaN(lat) && !isNaN(lng) && label) {
      const state: SearchState = { lat, lng, label, radiusMeters: r };
      setRadius(r);
      setPov(p);
      setTime(t);
      setSearchState(state);
      setPanelOpen(true);
      search({ lat, lng, label, radiusMeters: r, pov: p, time: t });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevFiltersRef = useRef({ pov, time, radius });
  const handlePovChange = (v: PovType) => {
    setPov(v);
    if (searchState) {
      prevFiltersRef.current = { pov: v, time, radius };
      search({ lat: searchState.lat, lng: searchState.lng, label: searchState.label, radiusMeters: radius, pov: v, time });
    }
  };
  const handleTimeChange = (v: TimeOfDay) => {
    setTime(v);
    if (searchState) {
      search({ lat: searchState.lat, lng: searchState.lng, label: searchState.label, radiusMeters: radius, pov, time: v });
    }
  };
  const handleRadiusChange = (v: number) => {
    setRadius(v);
    if (searchState) {
      setSearchState((s) => s ? { ...s, radiusMeters: v } : s);
      search({ lat: searchState.lat, lng: searchState.lng, label: searchState.label, radiusMeters: v, pov, time });
    }
  };

  const handleMapsLoaded = useCallback(() => setMapsLoaded(true), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-bg">
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 bg-brand-panel border-b border-brand-border z-20">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">\u{1F5FA}\uFE0F</span>
          <span className="font-bold text-brand-text tracking-tight text-lg">
            Wander<span className="text-brand-accent">Street</span>
          </span>
          <span className="hidden sm:inline text-xs text-brand-muted ml-1 border border-brand-border rounded px-1.5 py-0.5">
            Jakarta &middot; Beta
          </span>
        </div>

        <div className="flex-1 flex justify-center px-2">
          <SearchBar onPlaceSelected={handleLocationSelected} mapsApiLoaded={mapsLoaded} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AmbientMixer />
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${panelOpen ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-card border-brand-border text-brand-muted'}`}>
            \u{1F3AC}
            {videos.length > 0 && <span className="text-xs">{videos.length}</span>}
          </button>
        </div>
      </header>

      <FilterBar
        pov={pov}
        time={time}
        radius={radius}
        onPovChange={handlePovChange}
        onTimeChange={handleTimeChange}
        onRadiusChange={handleRadiusChange}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className={`relative transition-all duration-300 ${panelOpen ? 'hidden sm:block sm:flex-1' : 'flex-1'}`}>
          <MapView
            onLocationSelected={handleLocationSelected}
            onMapsLoaded={handleMapsLoaded}
            searchState={searchState}
            videos={videos}
            activePov={pov}
          />
          {!searchState && mapsLoaded && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-brand-panel/90 backdrop-blur-sm border border-brand-border text-brand-muted text-xs px-4 py-2 rounded-full pointer-events-none">
              Click anywhere on the map to find footage nearby
            </div>
          )}
        </div>

        <aside className={`flex flex-col border-l border-brand-border bg-brand-panel overflow-hidden ${panelOpen ? 'flex w-full sm:w-[380px]' : 'hidden sm:flex sm:w-[380px]'}`}>
          <VideoPanel
            videos={videos}
            loading={loading}
            error={error}
            searchLabel={searchState?.label ?? null}
            shareUrl={shareUrl}
          />
        </aside>
      </div>
    </div>
  );
}
