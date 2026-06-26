'use client';

import { useRef, useEffect, useState } from 'react';

interface SearchBarProps {
  onPlaceSelected: (lat: number, lng: number, label: string) => void;
  mapsApiLoaded: boolean;
}

export default function SearchBar({ onPlaceSelected, mapsApiLoaded }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!mapsApiLoaded || !inputRef.current) return;
    if (autocompleteRef.current) return; // already initialised

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address'],
      types: ['geocode', 'establishment'],
      // Bias towards Indonesia but allow global
      componentRestrictions: undefined,
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const label = place.name ?? place.formatted_address ?? 'Selected location';
      setValue(label);
      onPlaceSelected(lat, lng, label);
    });
  }, [mapsApiLoaded, onPlaceSelected]);

  return (
    <div className="relative flex-1 max-w-lg">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search any street, landmark, or address…"
        className="w-full pl-9 pr-4 py-2 bg-brand-card border border-brand-border rounded-lg text-brand-text text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
        disabled={!mapsApiLoaded}
      />
    </div>
  );
}
