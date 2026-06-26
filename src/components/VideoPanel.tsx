'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { VideoResult } from '@/lib/types';
import { POV_OPTIONS } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';

interface VideoPanelProps {
  videos: VideoResult[];
  loading: boolean;
  error: string | null;
  searchLabel: string | null;
}

export default function VideoPanel({ videos, loading, error, searchLabel }: VideoPanelProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toggle, isFavorited } = useFavorites();

  const activeVideo = videos.find((v) => v.id === activeId) ?? videos[0] ?? null;

  const getPovColor = (povType: string) => {
    return POV_OPTIONS.find((p) => p.id === povType)?.color ?? '#6c63ff';
  };

  const getPovEmoji = (povType: string) => {
    return POV_OPTIONS.find((p) => p.id === povType)?.emoji ?? '🎥';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-muted text-sm">Searching for footage nearby…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="text-red-400 text-sm">{error}</p>
        <p className="text-brand-muted text-xs">Check your API key or try a different location.</p>
      </div>
    );
  }

  if (!searchLabel) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <span className="text-6xl">🗺️</span>
        <h2 className="text-brand-text font-semibold text-lg">Drop a pin to explore</h2>
        <p className="text-brand-muted text-sm leading-relaxed">
          Search for any street, landmark or address, then click on the map to find real POV footage shot right there.
        </p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <span className="text-5xl">🎬</span>
        <p className="text-brand-text font-medium">No footage found here</p>
        <p className="text-brand-muted text-sm">
          Try widening the radius, changing the POV filter, or picking a more central spot.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Active player */}
      {activeVideo && (
        <div className="shrink-0">
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              key={activeVideo.id}
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {/* Now playing info */}
          <div className="px-4 py-3 bg-brand-card border-b border-brand-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-brand-text text-sm font-medium leading-snug line-clamp-2">
                  {activeVideo.title}
                </p>
                <p className="text-brand-muted text-xs mt-0.5">{activeVideo.channelTitle}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: getPovColor(activeVideo.povType) + '33', color: getPovColor(activeVideo.povType) }}
                >
                  {getPovEmoji(activeVideo.povType)} {activeVideo.povType}
                </span>
                <button
                  onClick={() => toggle(activeVideo)}
                  className="text-lg leading-none transition-transform hover:scale-110"
                  title={isFavorited(activeVideo.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorited(activeVideo.id) ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <p className="text-xs text-brand-muted">
            <span className="text-brand-text font-medium">{videos.length}</span> videos near{' '}
            <span className="text-brand-accent">{searchLabel}</span>
          </p>
        </div>

        <ul className="divide-y divide-brand-border">
          {videos.map((video) => (
            <li key={video.id}>
              <button
                onClick={() => setActiveId(video.id)}
                className={`w-full text-left flex gap-3 px-4 py-3 transition-colors ${
                  (activeVideo?.id === video.id)
                    ? 'bg-brand-accent/10 border-l-2 border-brand-accent'
                    : 'hover:bg-brand-card border-l-2 border-transparent'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative shrink-0 w-24 h-14 rounded overflow-hidden bg-brand-border">
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                  )}
                  {/* POV dot */}
                  <span
                    className="absolute top-1 left-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPovColor(video.povType) }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-brand-text text-xs font-medium leading-snug line-clamp-2">
                    {video.title}
                  </p>
                  <p className="text-brand-muted text-xs mt-1 truncate">{video.channelTitle}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: getPovColor(video.povType) + '33', color: getPovColor(video.povType) }}
                    >
                      {getPovEmoji(video.povType)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(video); }}
                      className="text-xs"
                    >
                      {isFavorited(video.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
