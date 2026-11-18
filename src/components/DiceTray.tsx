import React from 'react';
import { HOUSE_META } from '../game/constants';
import { PlayerColor } from '../game/types';

interface DiceTrayProps {
  value: number;
  rolling: boolean;
  canRoll: boolean;
  activeColor: PlayerColor;
  onRoll: () => void;
  label: string;
}

const PIP_LAYOUTS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

export const DiceTray: React.FC<DiceTrayProps> = ({
  value,
  rolling,
  canRoll,
  activeColor,
  onRoll,
  label,
}) => {
  const pips = PIP_LAYOUTS[value] ?? PIP_LAYOUTS[1];
  const house = HOUSE_META[activeColor];

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={!canRoll}
      aria-label={label}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
        canRoll
          ? 'cursor-pointer bg-[#36241a] hover:bg-[#432d21] active:scale-95 shadow-md ring-1 ring-amber-400/50'
          : 'cursor-default bg-[#281b14]/80 opacity-85 ring-1 ring-white/10'
      }`}
    >
      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#fffdf9] via-[#f6efe2] to-[#e4d6bf] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-[#bfa988] transition-transform duration-150 ${
          rolling ? 'animate-dice-tumble' : canRoll ? 'group-hover:scale-105' : ''
        }`}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {pips.map(([cx, cy], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={value === 1 ? 13 : 9.5}
              fill={value === 1 ? '#B91C1C' : '#1E1410'}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-col items-start text-left">
        <span
          className="text-xs font-semibold whitespace-nowrap"
          style={{ color: canRoll ? '#FDE68A' : '#D6C7B8' }}
        >
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-[#b8a594]">
          {rolling ? '···' : `#${value}`}
        </span>
      </div>

      {canRoll && (
        <span
          className="ml-auto h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: house.ring }}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
