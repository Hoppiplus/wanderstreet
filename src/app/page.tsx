'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { PovType, TimeOfDay, SearchState, VideoResult } from '@/lib/types';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';
import FilterBar from '@/components/FilterBar';
import VideoPanel from '@/components/VideoPanel';
import AmbientMixer from '@/components/AmbientMixer';
import SearchBar from '@/components/SearchBar';

// Load MapView without SSR — Google Maps needs window
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Home() {
  // ── Filters ────────────────────────────────────────────────────────────────
  const [pov, setPov] = useState<PovType>('all');
  const [time, setTime] = useState<TimeOfDay>('all');
  const [radius, setRadius] = useState<number>(500);

  // ── Map / search state ────────────────────────────────────────────────────
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // ── YouTube search ────────────────────────────────────────────────────────
  const { videos, loading, error, search } = useYouTubeSearch();

  // ── Panel toggle (mobile) ─────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);

  // Triggered by map click or Places autocomplete selection
  const handleLocationSelected = useCallback(
    (lat: number, lng: number, label: string) => {
      const state: SearchState = { lat, lng, label, radiusMeters: radius };
      setSearchState(state);
      setPanelOpen(true);
      search({ lat, lng, label, radiusMeters: radius, pov, time });
    },
    [radius, pov, time, search]
  );

  // Re-search when filters change if we already have a pin
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
      {/* ── Top nav ───────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 bg-brand-panel border-b border-brand-border z-20">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🗺️</span>
          <span className="font-bold text-brand-text tracking-tight text-lg">
            Wander<span className="text-brand-accent">Street</span>
          </span>
          <span className="hidden sm:inline text-xs text-brand-muted ml-1 border border-brand-border rounded px-1.5 py-0.5">
            Jakarta · Beta
          </span>
        </div>

        {/* Search bar — centred in header on desktop */}
        <div className="flex-1 flex justify-center px-2">
          <SearchBar
            onPlaceSelected={handleLocationSelected}
            mapsApiLoaded={mapsLoaded}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AmbientMixer />

          {/* Mobile panel toggle */}
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              panelOpen
                ? 'bg-brand-accent border-brand-accent text-white'
                : 'bg-brand-card border-brand-border text-brand-muted'
            }`}
          >
            🎬
            {videos.length > 0 && (
              <span className="text-xs">{videos.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <FilterBar
        pov={pov}
        time={time}
        radius={radius}
        onPovChange={handlePovChange}
        onTimeChange={handleTimeChange}
        onRadiusChange={handleRadiusChange}
      />

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map — takes all space on mobile, left 60% on desktop */}
        <div
          className={`relative transition-all duration-300 ${
            panelOpen ? 'hidden sm:block sm:flex-1' : 'flex-1'
          }`}
        >
          <MapView
            onLocationSelected={handleLocationSelected}
            onMapsLoaded={handleMapsLoaded}
            searchState={searchState}
            videos={videos}
            activePov={pov}
          />

          {/* Tap-to-explore hint */}
          {!searchState && mapsLoaded && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-brand-panel/90 backdrop-blur-sm border border-brand-border text-brand-muted text-xs px-4 py-2 rounded-full pointer-events-none">
              Click anywhere on the map to find footage nearby
            </div>
          )}
        </div>

        {/* Side panel — hidden on mobile unless toggled, fixed 380px on desktop */}
        <aside
          className={`
            flex flex-col border-l border-brand-border bg-brand-panel overflow-hidden
            ${panelOpen ? 'flex w-full sm:w-[380px]' : 'hidden sm:flex sm:w-[380px]'}
          `}
        >
          <VideoPanel
            videos={videos}
            loading={loading}
            error={error}
            searchLabel={searchState?.label ?? null}
          />
        </aside>
      </div>
    </div>
  );
}
