'use client';

import { useCallback, useRef, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
} from '@react-google-maps/api';
import type { VideoResult, PovType, SearchState } from '@/lib/types';
import { POV_OPTIONS } from '@/lib/types';

const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

// Dark-mode map style (Google Maps JSON)
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f0f14' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8888a8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6c63ff' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a1a24' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a3a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#16161e' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a50' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f1f2e' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a12' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

interface MapViewProps {
  onLocationSelected: (lat: number, lng: number, label: string) => void;
  onMapsLoaded: () => void;
  searchState: SearchState | null;
  videos: VideoResult[];
  activePov: PovType;
  children?: React.ReactNode; // SearchBar slot
}

// Jakarta centre
const JAKARTA_CENTER = { lat: -6.2088, lng: 106.8456 };

export default function MapView({
  onLocationSelected,
  onMapsLoaded,
  searchState,
  videos,
  activePov,
  children,
}: MapViewProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
    language: 'en',
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      onMapsLoaded();
    },
    [onMapsLoaded]
  );

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Reverse geocode for a nice label
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const label =
          status === 'OK' && results?.[0]
            ? results[0].formatted_address
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onLocationSelected(lat, lng, label);
      });
    },
    [onLocationSelected]
  );

  // Pan to selected location when it changes
  const prevSearchRef = useRef<SearchState | null>(null);
  if (searchState && searchState !== prevSearchRef.current) {
    prevSearchRef.current = searchState;
    mapRef.current?.panTo({ lat: searchState.lat, lng: searchState.lng });
    mapRef.current?.setZoom(16);
  }

  const getPovColor = (povType: string) =>
    POV_OPTIONS.find((p) => p.id === povType)?.color ?? '#6c63ff';

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-brand-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-muted text-sm">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Search bar overlay */}
      {children && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[min(560px,calc(100%-2rem))] shadow-2xl">
          {children}
        </div>
      )}

      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={JAKARTA_CENTER}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          styles: DARK_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          clickableIcons: false,
        }}
      >
        {/* Dropped pin with search radius circle */}
        {searchState && (
          <>
            <Marker
              position={{ lat: searchState.lat, lng: searchState.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#6c63ff',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
              }}
              title={searchState.label}
              zIndex={200}
            />
            <Circle
              center={{ lat: searchState.lat, lng: searchState.lng }}
              radius={searchState.radiusMeters}
              options={{
                fillColor: '#6c63ff',
                fillOpacity: 0.08,
                strokeColor: '#6c63ff',
                strokeOpacity: 0.4,
                strokeWeight: 1.5,
              }}
            />
          </>
        )}

        {/* Video pins — one per unique video location cluster */}
        {videos.map((video, i) => {
          // Videos don't always carry GPS — spread them in a tiny cluster around the search pin
          if (!searchState) return null;
          const angle = (i / videos.length) * 2 * Math.PI;
          const jitter = 0.0003 + (i % 3) * 0.0002;
          const lat = searchState.lat + jitter * Math.sin(angle);
          const lng = searchState.lng + jitter * Math.cos(angle);
          const color = getPovColor(video.povType);

          return (
            <Marker
              key={video.id}
              position={{ lat, lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: color,
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 1.5,
              }}
              title={video.title}
              zIndex={100}
            />
          );
        })}
      </GoogleMap>

      {/* POV legend */}
      <div className="absolute bottom-8 left-3 z-10 bg-brand-panel/90 backdrop-blur-sm border border-brand-border rounded-lg px-3 py-2 flex flex-col gap-1.5">
        {POV_OPTIONS.filter((p) => p.id !== 'all').map((opt) => (
          <div key={opt.id} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: opt.color }}
            />
            <span className="text-brand-muted">{opt.emoji} {opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
