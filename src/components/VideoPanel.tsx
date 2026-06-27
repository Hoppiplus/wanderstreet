'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { VideoResult } from '@/lib/types';
import { POV_OPTIONS } from '@/lib/types';
import { useFavorites } from '@/hooks/useFavorites';

type PanelTab = 'videos' | 'saved';

interface VideoPanelProps {
  videos: VideoResult[];
  loading: boolean;
  error: string | null;
  searchLabel: string | null;
  shareUrl?: string;
}

function timeAgo(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const y = Math.floor(diff / 31536000000);
  const mo = Math.floor(diff / 2592000000);
  const dy = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (y >= 1) return y + 'y ago';
  if (mo >= 1) return mo + 'mo ago';
  if (dy >= 1) return dy + 'd ago';
  if (h >= 1) return h + 'h ago';
  return m + 'm ago';
}

export default function VideoPanel({ videos, loading, error, searchLabel, shareUrl }: VideoPanelProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('videos');
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [copied, setCopied] = useState(false);
  const { favorites, toggle, isFavorited } = useFavorites();

  const currentList = panelTab === 'saved' ? favorites : videos;
  const activeVideo = currentList.find((v) => v.id === activeId) ?? currentList[0] ?? null;

  const getPovColor = (t: string) => POV_OPTIONS.find((p) => p.id === t)?.color ?? '#6c63ff';
  const getPovEmoji = (t: string) => POV_OPTIONS.find((p) => p.id === t)?.emoji ?? '\u{1F3A5}';

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl ?? window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const advanceVideo = useCallback(() => {
    if (currentList.length === 0) return;
    const idx = currentList.findIndex((v) => v.id === activeVideo?.id);
    const next = currentList[(idx + 1) % currentList.length];
    if (next) setActiveId(next.id);
  }, [activeVideo, currentList]);

  const TabBar = () => (
    <div className="shrink-0 flex border-b border-brand-border">
      {(['videos', 'saved'] as PanelTab[]).map((id) => {
        const count = id === 'saved' ? favorites.length : videos.length;
        const emoji = id === 'saved' ? '\u2764\uFE0F' : '\u{1F3A5}';
        const label = id === 'saved' ? 'Saved' : 'Videos';
        return (
          <button key={id}
            onClick={() => { setPanelTab(id); setActiveId(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-all ${panelTab === id ? 'border-brand-accent text-brand-accent' : 'border-transparent text-brand-muted hover:text-brand-text'}`}>
            {emoji} {label}
            {count > 0 && (
              <span className={`text-[10px] px-1 rounded-full ${panelTab === id ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-border text-brand-muted'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const VideoRow = ({ video }: { video: VideoResult }) => (
    <button
      onClick={() => setActiveId(video.id)}
      className={`w-full text-left flex gap-3 px-4 py-3 transition-colors ${activeVideo?.id === video.id ? 'bg-brand-accent/10 border-l-2 border-brand-accent' : 'hover:bg-brand-card border-l-2 border-transparent'}`}>
      <div className="relative shrink-0 w-24 h-14 rounded overflow-hidden bg-brand-border">
        {video.thumbnail ? (
          <Image src={video.thumbnail} alt={video.title} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">\u{1F3AC}</div>
        )}
        <span className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ backgroundColor: getPovColor(video.povType) }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-brand-text text-xs font-medium leading-snug line-clamp-2">{video.title}</p>
        <p className="text-brand-muted text-xs mt-0.5 truncate">{video.channelTitle}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: getPovColor(video.povType) + '33', color: getPovColor(video.povType) }}>
            {getPovEmoji(video.povType)}
          </span>
          {video.publishedAt && (
            <span className="text-brand-muted/60 text-[10px]">{timeAgo(video.publishedAt)}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggle(video); }}
            className="text-xs ml-auto">
            {isFavorited(video.id) ? '\u2764\uFE0F' : '\u{1F90D}'}
          </button>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-muted text-sm">Searching for footage nearby&hellip;</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-4xl">\u26A0\uFE0F</span>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!searchLabel) {
    return (
      <div className="flex flex-col h-full">
        <TabBar />
        {panelTab === 'saved' ? (
          favorites.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="text-5xl">\u{1F90D}</span>
              <p className="text-brand-text font-medium">No saved videos yet</p>
              <p className="text-brand-muted text-sm">Tap the heart on any video to save it here.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-brand-border">
                {favorites.map((v) => <li key={v.id}><VideoRow video={v} /></li>)}
              </ul>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="text-6xl">\u{1F5FA}\uFE0F</span>
            <h2 className="text-brand-text font-semibold text-lg">Drop a pin to explore</h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Click anywhere on the map to find real POV footage shot right there.
            </p>
            {favorites.length > 0 && (
              <button
                onClick={() => setPanelTab('saved')}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full border border-brand-accent/40 text-brand-accent text-sm hover:bg-brand-accent/10 transition-all">
                \u2764\uFE0F View {favorites.length} saved video{favorites.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (videos.length === 0 && panelTab === 'videos') {
    return (
      <div className="flex flex-col h-full">
        <TabBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-5xl">\u{1F3AC}</span>
          <p className="text-brand-text font-medium">No footage found here</p>
          <p className="text-brand-muted text-sm">
            Try widening the radius, changing the POV filter, or picking a more central spot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TabBar />

      {panelTab === 'saved' && favorites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-5xl">\u{1F90D}</span>
          <p className="text-brand-text font-medium">No saved videos yet</p>
          <p className="text-brand-muted text-sm">Tap the heart on any video to save it for later.</p>
          <button
            onClick={() => setPanelTab('videos')}
            className="text-xs text-brand-accent border border-brand-accent/30 px-3 py-1.5 rounded-full hover:bg-brand-accent/10 transition-all">
            Browse videos
          </button>
        </div>
      ) : (
        <>
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
              <div className="px-4 py-3 bg-brand-card border-b border-brand-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-brand-text text-sm font-medium leading-snug line-clamp-2">{activeVideo.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-brand-muted text-xs">{activeVideo.channelTitle}</p>
                      {activeVideo.publishedAt && (
                        <span className="text-brand-muted/60 text-xs">&middot; {timeAgo(activeVideo.publishedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: getPovColor(activeVideo.povType) + '33', color: getPovColor(activeVideo.povType) }}>
                      {getPovEmoji(activeVideo.povType)} {activeVideo.povType}
                    </span>
                    <button onClick={() => toggle(activeVideo)} className="text-lg leading-none transition-transform hover:scale-110">
                      {isFavorited(activeVideo.id) ? '\u2764\uFE0F' : '\u{1F90D}'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b border-brand-border bg-brand-bg/40">
            <button
              onClick={() => setAutoAdvance((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${autoAdvance ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent' : 'border-brand-border text-brand-muted hover:border-brand-accent/30 hover:text-brand-accent'}`}>
              {autoAdvance ? '\u25B6\uFE0F Auto on' : '\u23ED\uFE0F Auto-advance'}
            </button>
            <div className="ml-auto flex items-center gap-2">
              {currentList.length > 1 && (
                <button onClick={advanceVideo}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border border-brand-border text-brand-muted hover:text-brand-text transition-all">
                  \u23ED Next
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border border-brand-border text-brand-muted hover:text-brand-text transition-all">
                {copied ? '\u2705 Copied!' : '\u{1F517} Share'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs text-brand-muted">
                <span className="text-brand-text font-medium">{currentList.length}</span>{' '}
                {panelTab === 'saved'
                  ? 'saved videos'
                  : <><span>videos near </span><span className="text-brand-accent">{searchLabel}</span></>
                }
              </p>
            </div>
            <ul className="divide-y divide-brand-border">
              {currentList.map((video) => <li key={video.id}><VideoRow video={video} /></li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
