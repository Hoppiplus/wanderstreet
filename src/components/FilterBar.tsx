'use client';

import { POV_OPTIONS, TIME_OPTIONS } from '@/lib/types';
import type { PovType, TimeOfDay } from '@/lib/types';

interface FilterBarProps {
  pov: PovType;
  time: TimeOfDay;
  radius: number;
  onPovChange: (v: PovType) => void;
  onTimeChange: (v: TimeOfDay) => void;
  onRadiusChange: (v: number) => void;
}

export default function FilterBar({
  pov, time, radius, onPovChange, onTimeChange, onRadiusChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-brand-panel border-b border-brand-border">
      {/* POV Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-brand-muted uppercase tracking-widest mr-1 shrink-0">POV</span>
        {POV_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onPovChange(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              pov === opt.id
                ? 'text-white border-transparent'
                : 'bg-brand-card border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-accent'
            }`}
            style={pov === opt.id ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
          >
            <span>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Time + Radius Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-brand-muted uppercase tracking-widest mr-1 shrink-0">Time</span>
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onTimeChange(opt.id)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              time === opt.id
                ? 'bg-brand-accent border-brand-accent text-white'
                : 'bg-brand-card border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-accent'
            }`}
            title={opt.range}
          >
            <span>{opt.emoji}</span>
            <span>{opt.label}</span>
            {opt.range && <span className="opacity-60 ml-0.5">({opt.range})</span>}
          </button>
        ))}

        {/* Radius slider */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-xs text-brand-muted">Radius</span>
          <input
            type="range"
            min={200}
            max={800}
            step={100}
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-24 accent-brand-accent"
          />
          <span className="text-xs text-brand-text w-12">{radius}m</span>
        </div>
      </div>
    </div>
  );
}
