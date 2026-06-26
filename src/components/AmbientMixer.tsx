'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Howl } from 'howler';
import { SOUND_TRACKS, SOUND_CATEGORIES } from '@/lib/types';
import type { SoundCategory } from '@/lib/types';

interface TrackState {
  volume: number;   // 0–1
  playing: boolean;
}

type SoundMap = Record<string, Howl>;
type StateMap = Record<string, TrackState>;

export default function AmbientMixer() {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SoundCategory>('street');
  const [states, setStates] = useState<StateMap>(() =>
    Object.fromEntries(SOUND_TRACKS.map((t) => [t.id, { volume: 0.5, playing: false }]))
  );

  const howlsRef = useRef<SoundMap>({});

  // Lazy-init a Howl when first needed (avoids loading 16 audio files upfront)
  const getHowl = useCallback((id: string, src: string): Howl => {
    if (!howlsRef.current[id]) {
      howlsRef.current[id] = new Howl({
        src: [src],
        loop: true,
        volume: states[id]?.volume ?? 0.5,
        html5: true,
      });
    }
    return howlsRef.current[id];
  }, [states]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(howlsRef.current).forEach((h) => h.unload());
    };
  }, []);

  const toggleTrack = (id: string, src: string) => {
    const howl = getHowl(id, src);
    const current = states[id];

    if (current.playing) {
      howl.pause();
      setStates((prev) => ({ ...prev, [id]: { ...prev[id], playing: false } }));
    } else {
      howl.play();
      setStates((prev) => ({ ...prev, [id]: { ...prev[id], playing: true } }));
    }
  };

  const setVolume = (id: string, src: string, vol: number) => {
    const howl = getHowl(id, src);
    howl.volume(vol);
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], volume: vol } }));
  };

  const stopAll = () => {
    Object.values(howlsRef.current).forEach((h) => h.pause());
    setStates((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, s]) => [id, { ...s, playing: false }]))
    );
  };

  const activeTracks = SOUND_TRACKS.filter((t) => t.category === activeCategory);
  const anyPlaying = Object.values(states).some((s) => s.playing);
  const playingCount = Object.values(states).filter((s) => s.playing).length;

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
          anyPlaying
            ? 'bg-brand-accent border-brand-accent text-white'
            : 'bg-brand-card border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-accent'
        }`}
        title="Ambient sound mixer"
      >
        <span className="text-base">🎧</span>
        <span className="hidden sm:inline">Sounds</span>
        {anyPlaying && (
          <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
            {playingCount}
          </span>
        )}
      </button>

      {/* Mixer panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-brand-panel border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎧</span>
              <span className="text-brand-text font-semibold text-sm">Ambient Mixer</span>
            </div>
            <div className="flex items-center gap-2">
              {anyPlaying && (
                <button
                  onClick={stopAll}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Stop all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-brand-muted hover:text-brand-text text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex border-b border-brand-border">
            {SOUND_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'text-brand-accent border-b-2 border-brand-accent'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                <span className="block text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Tracks */}
          <div className="divide-y divide-brand-border max-h-64 overflow-y-auto">
            {activeTracks.map((track) => {
              const state = states[track.id];
              return (
                <div key={track.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleTrack(track.id, track.src)}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      state.playing
                        ? 'bg-brand-accent text-white'
                        : 'bg-brand-card border border-brand-border text-brand-muted hover:border-brand-accent hover:text-brand-text'
                    }`}
                    title={state.playing ? 'Pause' : 'Play'}
                  >
                    {state.playing ? '⏸' : '▶'}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{track.emoji}</span>
                      <span className="text-xs text-brand-text truncate">{track.label}</span>
                      {state.playing && (
                        <span className="ml-auto flex gap-0.5 items-end h-3">
                          {[1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className="w-0.5 bg-brand-accent rounded-full animate-bounce"
                              style={{
                                height: `${6 + i * 2}px`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={state.volume}
                      onChange={(e) => setVolume(track.id, track.src, Number(e.target.value))}
                      className="w-full accent-brand-accent h-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-2 bg-brand-bg/50 text-[10px] text-brand-muted text-center">
            Place sound files in <code className="text-brand-accent">/public/sounds/</code>
          </div>
        </div>
      )}
    </div>
  );
}
