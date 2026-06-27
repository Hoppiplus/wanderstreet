import { NextRequest, NextResponse } from 'next/server';
import type { PovType, TimeOfDay, VideoResult } from '@/lib/types';
import { POV_OPTIONS, TIME_OPTIONS } from '@/lib/types';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// Infer a POV type from a video title / description
function inferPov(title: string, description: string): PovType {
  const text = (title + ' ' + description).toLowerCase();
  if (/dashcam|driving|drive through|car pov|berkendara/.test(text)) return 'car';
  if (/motorbike|motorcycle|scooter|ojek|naik motor/.test(text)) return 'motorbike';
  if (/walking|walk through|jalan-jalan|pedestrian|street walk|berjalan/.test(text)) return 'walking';
  if (/krl|commuter line|kereta/.test(text)) return 'train';
  if (/\bmrt\b|lrt jakarta|metro|subway/.test(text)) return 'mrt';
  return 'walking';
}

/**
 * Extract 2-3 meaningful place-name tokens from a Google geocoder label.
 * e.g. "Jl. Sawo No.26, RT.4/RW.2, Gondangdia, Kec. Menteng, Kota Jakarta Pusat, ..."
 *   -> "Gondangdia Kec. Menteng Jakarta Pusat"
 *
 * Fixes:
 *  - Skip RT/RW codes (RT.4/RW.2 etc.) — meaningless to YouTube
 *  - Skip segments containing embedded postal codes
 *  - Skip province-level segments (Daerah Khusus Ibukota...)
 *  - Strip "Kota " prefix so "Kota Jakarta Pusat" -> "Jakarta Pusat"
 *  - Take up to 3 parts so the city name is included
 */
function extractAreaName(label: string): string {
  if (!label) return 'Jakarta';

  const parts = label.split(',').map((s) => s.trim()).filter((s) => s.length > 1);

  const SKIP_EXACT = new Set([
    'indonesia', 'dki jakarta', 'jawa barat', 'jawa tengah', 'jawa timur',
    'banten', 'bali', 'sumatera utara', 'sulawesi selatan',
  ]);
  const STANDALONE_POSTAL = /^\d{5}$/;
  const RT_RW = /^rt\.?\s*\d+\s*\/\s*rw\.?\s*\d+/i;
  const EMBEDDED_POSTAL = /\b\d{5}\b/;
  const PROVINCE_PREFIX = /^(daerah|provinsi|prov\.|d\.i\.)/i;
  const STREET_PREFIX = /^(jl\.|jalan\s|no\.|gang\s|gg\.)/i;

  const meaningful = parts
    .filter((p) => {
      const low = p.toLowerCase();
      return (
        !SKIP_EXACT.has(low) &&
        !STANDALONE_POSTAL.test(p) &&
        !RT_RW.test(p) &&
        !EMBEDDED_POSTAL.test(p) &&
        !PROVINCE_PREFIX.test(p) &&
        p.length < 60
      );
    })
    // Strip "Kota " prefix -> "Kota Jakarta Pusat" becomes "Jakarta Pusat"
    .map((p) => p.replace(/^kota\s+/i, '').trim());

  // Skip leading street segment
  const start = meaningful[0] && STREET_PREFIX.test(meaningful[0]) ? 1 : 0;

  // Take neighbourhood + district + city (up to 3 parts)
  const selected = meaningful.slice(start, start + 3);
  return selected.join(' ') || 'Jakarta';
}

/**
 * Build a tight YouTube search query targeting POV street footage.
 */
function buildQuery(
  areaName: string,
  povOption: (typeof POV_OPTIONS)[0],
  timeOption: (typeof TIME_OPTIONS)[0]
): string {
  const povSignal =
    povOption.id === 'all' ? 'POV street walking tour OR dashcam' : povOption.searchTerms[0];
  const timePart = timeOption.searchTerms[0] ?? '';
  const parts = [areaName, povSignal, timePart].filter(Boolean);
  return parts.join(' ');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const label = searchParams.get('label') ?? '';
  const pov = (searchParams.get('pov') ?? 'all') as PovType;
  const time = (searchParams.get('time') ?? 'all') as TimeOfDay;

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const povOption = POV_OPTIONS.find((p) => p.id === pov) ?? POV_OPTIONS[0];
  const timeOption = TIME_OPTIONS.find((t) => t.id === time) ?? TIME_OPTIONS[0];

  const areaName = extractAreaName(label);
  const query = buildQuery(areaName, povOption, timeOption);

  console.log('[youtube] query:', query, '| label:', label);

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: '20',
    order: 'relevance',
    videoEmbeddable: 'true',
    videoDuration: 'any',
    relevanceLanguage: 'id',
    key: apiKey,
  });

  const searchUrl = `${YT_BASE}/search?${params}`;

  try {
    const searchRes = await fetch(searchUrl, { next: { revalidate: 300 } });
    if (!searchRes.ok) {
      const err = await searchRes.json();
      console.error('YouTube API error:', err);
      return NextResponse.json({ error: 'YouTube search failed', detail: err }, { status: searchRes.status });
    }

    const searchData = await searchRes.json();

    // Filter for POV/street content
    const POV_MUST_MATCH =
      /pov|walking|walk|dashcam|drive|driving|motorbike|motorcycle|ojek|scooter|krl|mrt|lrt|jalan-jalan|tour|street|riding|naik|berkendara|first.?person/i;

    const items: VideoResult[] = (searchData.items ?? [])
      .filter((item: any) => {
        const title = item.snippet.title ?? '';
        const desc = item.snippet.description ?? '';
        return POV_MUST_MATCH.test(title) || POV_MUST_MATCH.test(desc);
      })
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnail:
          item.snippet.thumbnails?.medium?.url ??
          item.snippet.thumbnails?.default?.url ??
          '',
        description: item.snippet.description ?? '',
        povType: inferPov(item.snippet.title, item.snippet.description ?? ''),
      }));

    // Fall back to unfiltered if strict filter removed everything
    const fallback =
      items.length === 0
        ? (searchData.items ?? []).map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            thumbnail:
              item.snippet.thumbnails?.medium?.url ??
              item.snippet.thumbnails?.default?.url ??
              '',
            description: item.snippet.description ?? '',
            povType: inferPov(item.snippet.title, item.snippet.description ?? ''),
          }))
        : items;

    return NextResponse.json({ items: fallback, totalResults: fallback.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
