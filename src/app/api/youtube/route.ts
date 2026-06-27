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
  return 'walking'; // default to walking rather than 'all'
}

/**
 * Extract 1–3 meaningful place-name tokens from a Google geocoder label.
 * e.g. "Jl. Sudirman No.1, Senayan, Kby. Baru, Jakarta Selatan, DKI Jakarta, Indonesia"
 *   → "Senayan Jakarta Selatan"
 *
 * Strategy: skip street-level part (first segment, usually starts with "Jl."/"No."),
 * grab next 2 segments that aren't "Indonesia" or a postal code.
 */
function extractAreaName(label: string): string {
  const parts = label
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  const skip = new Set(['indonesia', 'dki jakarta', 'jawa barat', 'jawa tengah', 'jawa timur', 'banten']);
  const postalRe = /^\d{5}$/;

  const meaningful = parts.filter((p) => {
    const low = p.toLowerCase();
    return !skip.has(low) && !postalRe.test(p) && p.length < 50;
  });

  // Skip the very first segment if it looks like a street address
  const start = meaningful[0]?.match(/^(Jl\.|Jalan|No\.|Gang|Gg\.)/i) ? 1 : 0;
  return meaningful.slice(start, start + 2).join(' ');
}

/**
 * Build a tight YouTube search query that explicitly targets POV street footage.
 *
 * Core insight: YouTube's location param only works if the uploader tagged GPS coords —
 * almost nobody does. Instead we use the geocoded place name + strong POV signal words
 * so results are actually footage of that neighbourhood.
 */
function buildQuery(
  areaName: string,
  povOption: (typeof POV_OPTIONS)[0],
  timeOption: (typeof TIME_OPTIONS)[0]
): string {
  // Primary POV signal — pick the most distinctive term for this type
  const povSignal = povOption.id === 'all'
    ? 'POV street walking tour OR dashcam'
    : povOption.searchTerms[0];

  // Time signal (optional)
  const timePart = timeOption.searchTerms[0] ?? '';

  // Assemble: area name first (most important), then POV, then time
  const parts = [areaName, povSignal, timePart].filter(Boolean);
  return parts.join(' ');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const label = searchParams.get('label') ?? ''; // reverse-geocoded address
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

  // Use the place name to build a meaningful query — much more reliable than GPS metadata
  const areaName = label ? extractAreaName(label) : 'Jakarta';
  const query = buildQuery(areaName, povOption, timeOption);

  console.log('[youtube] query:', query, '| label:', label);

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: '20',
    order: 'relevance',
    videoEmbeddable: 'true',
    videoDuration: 'medium', // 4–20 min — skips Shorts and hour-long uploads
    relevanceLanguage: 'id', // Indonesian results preferred
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

    // Filter out obvious non-POV content (food reviews, music, tutorials, etc.)
    const POV_MUST_MATCH = /pov|walking|walk|dashcam|drive|driving|motorbike|motorcycle|ojek|scooter|krl|mrt|lrt|jalan-jalan|tour|street|riding|naik|berkendara|first.?person/i;

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

    // If the strict filter removed everything, fall back to unfiltered results
    const fallback = items.length === 0
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
