import { NextRequest, NextResponse } from 'next/server';
import type { PovType, TimeOfDay, VideoResult } from '@/lib/types';
import { POV_OPTIONS, TIME_OPTIONS } from '@/lib/types';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// Infer a POV type from a video title / description
function inferPov(title: string, description: string): PovType {
  const text = (title + ' ' + description).toLowerCase();
  if (/dashcam|driving|drive through|car pov/.test(text)) return 'car';
  if (/motorbike|motorcycle|scooter|ojek/.test(text)) return 'motorbike';
  if (/walking|walk through|jalan-jalan|pedestrian/.test(text)) return 'walking';
  if (/krl|commuter line|kereta/.test(text)) return 'train';
  if (/mrt|lrt|metro|subway/.test(text)) return 'mrt';
  return 'all';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') ?? '500'; // metres
  const pov = (searchParams.get('pov') ?? 'all') as PovType;
  const time = (searchParams.get('time') ?? 'all') as TimeOfDay;

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  // Build query terms from selected POV and time filters
  const povOption = POV_OPTIONS.find((p) => p.id === pov) ?? POV_OPTIONS[0];
  const timeOption = TIME_OPTIONS.find((t) => t.id === time) ?? TIME_OPTIONS[0];

  const queryTerms = [
    ...povOption.searchTerms.slice(0, 2),
    ...timeOption.searchTerms.slice(0, 1),
    'Indonesia',
  ].join(' ');

  // YouTube location search: radius in metres must be expressed as e.g. "500m"
  const radiusKm = Math.max(0.2, Math.min(5, parseInt(radius) / 1000));
  const locationRadius = `${radiusKm}km`;

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    location: `${lat},${lng}`,
    locationRadius,
    q: queryTerms,
    maxResults: '25',
    order: 'relevance',
    videoEmbeddable: 'true',
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
    const items: VideoResult[] = (searchData.items ?? []).map((item: any) => ({
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

    return NextResponse.json({ items, totalResults: searchData.pageInfo?.totalResults ?? items.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
