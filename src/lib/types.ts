// ─── POV Types ────────────────────────────────────────────────────────────────

export type PovType =
  | 'car'
  | 'motorbike'
  | 'walking'
  | 'train'
  | 'mrt'
  | 'all';

export interface PovOption {
  id: PovType;
  label: string;
  emoji: string;
  color: string; // hex, used for map pin colour
  searchTerms: string[]; // appended to YouTube query
}

export const POV_OPTIONS: PovOption[] = [
  {
    id: 'all',
    label: 'All',
    emoji: '🌐',
    color: '#6c63ff',
    searchTerms: ['POV', 'dashcam', 'street view', 'walking tour'],
  },
  {
    id: 'car',
    label: 'Car / Dashcam',
    emoji: '🚗',
    color: '#f59e0b',
    searchTerms: ['dashcam', 'driving', 'car POV', 'drive through'],
  },
  {
    id: 'motorbike',
    label: 'Motorbike',
    emoji: '🛵',
    color: '#ef4444',
    searchTerms: ['motorbike', 'motorcycle', 'scooter ride', 'ojek POV'],
  },
  {
    id: 'walking',
    label: 'Walking',
    emoji: '🚶',
    color: '#22c55e',
    searchTerms: ['walking tour', 'walk through', 'pedestrian POV', 'street walk'],
  },
  {
    id: 'train',
    label: 'Train / KRL',
    emoji: '🚆',
    color: '#3b82f6',
    searchTerms: ['KRL', 'commuter line', 'train ride', 'kereta'],
  },
  {
    id: 'mrt',
    label: 'MRT / Metro',
    emoji: '🚇',
    color: '#8b5cf6',
    searchTerms: ['MRT Jakarta', 'metro ride', 'LRT Jakarta', 'subway'],
  },
];

// ─── Time of Day ──────────────────────────────────────────────────────────────

export type TimeOfDay =
  | 'all'
  | 'dawn'
  | 'morning'
  | 'afternoon'
  | 'golden'
  | 'night'
  | 'late_night';

export interface TimeOption {
  id: TimeOfDay;
  label: string;
  emoji: string;
  range: string;
  searchTerms: string[];
}

export const TIME_OPTIONS: TimeOption[] = [
  { id: 'all', label: 'Any time', emoji: '🕐', range: '', searchTerms: [] },
  { id: 'dawn', label: 'Dawn', emoji: '🌅', range: '5–7am', searchTerms: ['dawn', 'sunrise', 'subuh'] },
  { id: 'morning', label: 'Morning', emoji: '☀️', range: '7–11am', searchTerms: ['morning', 'pagi'] },
  { id: 'afternoon', label: 'Afternoon', emoji: '🌤️', range: '11am–4pm', searchTerms: ['afternoon', 'siang'] },
  { id: 'golden', label: 'Golden Hour', emoji: '🌇', range: '4–7pm', searchTerms: ['golden hour', 'sunset', 'sore'] },
  { id: 'night', label: 'Night', emoji: '🌃', range: '7pm–12am', searchTerms: ['night', 'malam', 'nighttime'] },
  { id: 'late_night', label: 'Late Night', emoji: '🌙', range: '12–5am', searchTerms: ['late night', 'midnight', 'dini hari'] },
];

// ─── YouTube Video Result ─────────────────────────────────────────────────────

export interface VideoResult {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
  lat?: number;
  lng?: number;
  povType: PovType;
  duration?: string;
}

// ─── Map Pin ──────────────────────────────────────────────────────────────────

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  videos: VideoResult[];
  povType: PovType;
}

// ─── Ambient Sound ────────────────────────────────────────────────────────────

export type SoundCategory = 'street' | 'transport' | 'cultural' | 'nature';

export interface SoundTrack {
  id: string;
  category: SoundCategory;
  label: string;
  emoji: string;
  // In a real deployment, host these in /public/sounds/
  // Using free CC0 audio or generate with ElevenLabs / Freesound
  src: string;
}

export const SOUND_CATEGORIES: { id: SoundCategory; label: string; emoji: string }[] = [
  { id: 'street', label: 'Street / City', emoji: '🏙️' },
  { id: 'transport', label: 'Transport', emoji: '🚉' },
  { id: 'cultural', label: 'Cultural', emoji: '🕌' },
  { id: 'nature', label: 'Nature / Markets', emoji: '🌿' },
];

export const SOUND_TRACKS: SoundTrack[] = [
  // Street / City
  { id: 'jakarta_traffic', category: 'street', label: 'Jakarta Traffic', emoji: '🚗', src: '/sounds/jakarta_traffic.mp3' },
  { id: 'motorbike_swarm', category: 'street', label: 'Motorbike Swarm', emoji: '🛵', src: '/sounds/motorbike_swarm.mp3' },
  { id: 'rain_zinc', category: 'street', label: 'Rain on Zinc Roof', emoji: '🌧️', src: '/sounds/rain_zinc.mp3' },
  { id: 'street_vendor', category: 'street', label: 'Street Vendor Calls', emoji: '📢', src: '/sounds/street_vendor.mp3' },
  // Transport
  { id: 'krl_station', category: 'transport', label: 'KRL Announcement', emoji: '🔊', src: '/sounds/krl_station.mp3' },
  { id: 'mrt_chime', category: 'transport', label: 'MRT Departure Chime', emoji: '🚇', src: '/sounds/mrt_chime.mp3' },
  { id: 'train_wheels', category: 'transport', label: 'Train Wheels', emoji: '🚆', src: '/sounds/train_wheels.mp3' },
  { id: 'station_crowd', category: 'transport', label: 'Station Crowd', emoji: '👥', src: '/sounds/station_crowd.mp3' },
  // Cultural
  { id: 'azan', category: 'cultural', label: 'Azan (Call to Prayer)', emoji: '🕌', src: '/sounds/azan.mp3' },
  { id: 'gamelan', category: 'cultural', label: 'Gamelan Music', emoji: '🎼', src: '/sounds/gamelan.mp3' },
  { id: 'dangdut', category: 'cultural', label: 'Dangdut from Speaker', emoji: '🎵', src: '/sounds/dangdut.mp3' },
  { id: 'warung_tv', category: 'cultural', label: 'Warung TV Background', emoji: '📺', src: '/sounds/warung_tv.mp3' },
  // Nature / Markets
  { id: 'pasar_malam', category: 'nature', label: 'Night Market Buzz', emoji: '🏮', src: '/sounds/pasar_malam.mp3' },
  { id: 'warung_kitchen', category: 'nature', label: 'Warung Kitchen Sizzle', emoji: '🍳', src: '/sounds/warung_kitchen.mp3' },
  { id: 'ocean_waves', category: 'nature', label: 'Ocean Waves (Bali)', emoji: '🌊', src: '/sounds/ocean_waves.mp3' },
  { id: 'morning_market', category: 'nature', label: 'Morning Market Bustle', emoji: '🧺', src: '/sounds/morning_market.mp3' },
];

// ─── Misc ─────────────────────────────────────────────────────────────────────

export interface SearchState {
  lat: number;
  lng: number;
  label: string;
  radiusMeters: number;
}
