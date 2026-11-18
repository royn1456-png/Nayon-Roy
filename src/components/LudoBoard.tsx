import React, { useMemo, useState } from 'react';
import {
  HOME_STRETCH_COORDS,
  HOUSE_META,
  RING_COORDS,
  STAR_RING_INDICES,
  YARD_SLOTS,
} from '../game/constants';
import { getProgressCoords, getTokenCoords } from '../game/engine';
import { CaptureEffect, MoveOption, PlayerColor, Token } from '../game/types';

interface LudoBoardProps {
  tokens: Token[];
  validMoves: MoveOption[];
  activeColor: PlayerColor;
  canSelectToken: boolean;
  animatingTokenId: string | null;
  captureEffects: CaptureEffect[];
  onSelectMove: (move: MoveOption) => void;
}

const STAR_PATH =
  'M 0,-0.34 L 0.088,-0.11 L 0.33,-0.105 L 0.14,0.05 L 0.21,0.29 L 0,0.145 L -0.21,0.29 L -0.14,0.05 L -0.33,-0.105 L -0.088,-0.11 Z';

function getCellFill(row: number, col: number): string {
  // Colored start squares
  if (row === 6 && col === 1) return HOUSE_META.red.fill;
  if (row === 1 && col === 8) return HOUSE_META.green.fill;
  if (row === 8 && col === 13) return HOUSE_META.yellow.fill;
  if (row === 13 && col === 6) return HOUSE_META.blue.fill;

  // Home stretches
  if (row === 7 && col >= 1 && col <= 5) return HOUSE_META.red.fill;
  if (col === 7 && row >= 1 && row <= 5) return HOUSE_META.green.fill;
  if (row === 7 && col >= 9 && col <= 13) return HOUSE_META.yellow.fill;
  if (col === 7 && row >= 9 && row <= 13) return HOUSE_META.blue.fill;

  // Star safe squares subtle ivory tint
  if (
    (row === 2 && col === 6) ||
    (row === 6 && col === 12) ||
    (row === 12 && col === 8) ||
    (row === 8 && col === 2)
  ) {
    return '#F3EAD8';
  }

  return '#FAF6EE';
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  tokens,
  validMoves,
  activeColor,
  canSelectToken,
  animatingTokenId,
  captureEffects,
  onSelectMove,
}) => {
  const [hoveredMove, setHoveredMove] = useState<MoveOption | null>(null);

  const validMoveMap = useMemo(() => {
    const map = new Map<string, MoveOption>();
    for (const m of validMoves) {
      map.set(m.tokenId, m);
    }
    return map;
  }, [validMoves]);

  // Group tokens occupying the exact same (row, col) so they never overlap invisibly
  const positionedTokens = useMemo(() => {
    const groups = new Map<string, Token[]>();
    for (const t of tokens) {
      const [r, c] = getTokenCoords(t);
      const key = `${r.toFixed(2)},${c.toFixed(2)}`;
      const list = groups.get(key);
      if (list) list.push(t);
      else groups.set(key, [t]);
    }

    return tokens.map((token) => {
      const [row, col] = getTokenCoords(token);
      const key = `${row.toFixed(2)},${col.toFixed(2)}`;
      const group = groups.get(key) ?? [token];
      const idxInGroup = group.findIndex((g) => g.id === token.id);
      const count = group.length;

      let offsetX = 0;
      let offsetY = 0;
      let scale = 1;

      if (count === 2) {
        offsetX = idxInGroup === 0 ? -1.15 : 1.15;
        scale = 0.84;
      } else if (count === 3) {
        const offsets = [
          [-1.1, -0.9],
          [1.1, -0.9],
          [0, 1.1],
        ];
        [offsetX, offsetY] = offsets[idxInGroup] ?? [0, 0];
        scale = 0.76;
      } else if (count >= 4) {
        const offsets = [
          [-1.1, -1.1],
          [1.1, -1.1],
          [-1.1, 1.1],
          [1.1, 1.1],
        ];
        [offsetX, offsetY] = offsets[idxInGroup % 4];
        scale = 0.72;
      }

      const leftPct = ((col + 0.5) / 15) * 100 + offsetX;
      const topPct = ((row + 0.5) / 15) * 100 + offsetY;

      return { token, leftPct, topPct, scale, count };
    });
  }, [tokens]);

  const hoveredDest = useMemo(() => {
    if (!hoveredMove || !canSelectToken) return null;
    const token = tokens.find((t) => t.id === hoveredMove.tokenId);
    if (!token) return null;
    const [row, col] = getProgressCoords(token.color, token.index, hoveredMove.toProgress);
    return {
      leftPct: ((col + 0.5) / 15) * 100,
      topPct: ((row + 0.5) / 15) * 100,
      isCapture: hoveredMove.captures.length > 0,
      color: token.color,
    };
  }, [hoveredMove, canSelectToken, tokens]);

  // All track cells (ring + home stretch)
  const trackCells = useMemo(() => {
    const cells: Array<{ row: number; col: number; key: string }> = [];
    for (const [r, c] of RING_COORDS) {
      cells.push({ row: r, col: c, key: `r-${r}-${c}` });
    }
    (Object.keys(HOME_STRETCH_COORDS) as PlayerColor[]).forEach((color) => {
      for (const [r, c] of HOME_STRETCH_COORDS[color]) {
        cells.push({ row: r, col: c, key: `h-${r}-${c}` });
      }
    });
    return cells;
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[min(54dvh,92vw)] lg:max-w-[min(78dvh,calc(100vw-600px))] select-none rounded-[22px] bg-gradient-to-br from-[#5a3b28] via-[#3c2417] to-[#26160d] p-2 sm:p-3.5 shadow-[0_24px_64px_rgba(0,0,0,0.68),inset_0_1px_1px_rgba(255,235,205,0.22)] ring-1 ring-[#8a6343]/40">
      {/* Inlaid Ivory Board */}
      <div className="relative h-full w-full overflow-hidden rounded-[12px] bg-[#FAF6EE] shadow-[inset_0_0_0_1.5px_#2d1d14]">
        <svg viewBox="0 0 15 15" className="h-full w-full block" aria-label="Ludo Board">
          {/* Base ivory background */}
          <rect x="0" y="0" width="15" height="15" fill="#FAF6EE" />

          {/* Track Squares */}
          {trackCells.map(({ row, col, key }) => (
            <rect
              key={key}
              x={col}
              y={row}
              width={1}
              height={1}
              fill={getCellFill(row, col)}
              stroke="#C9BCA8"
              strokeWidth={0.045}
            />
          ))}

          {/* Star Safe Markers */}
          {Array.from(STAR_RING_INDICES).map((ringIdx) => {
            const [row, col] = RING_COORDS[ringIdx];
            return (
              <path
                key={`star-${ringIdx}`}
                d={STAR_PATH}
                transform={`translate(${col + 0.5}, ${row + 0.5})`}
                fill="none"
                stroke="#8B7355"
                strokeWidth={0.065}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Colored Start Arrows */}
          {/* Red start (6,1) pointing right */}
          <path
            d="M 1.28 6.5 L 1.72 6.5 M 1.56 6.32 L 1.74 6.5 L 1.56 6.68"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={0.09}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Green start (1,8) pointing down */}
          <path
            d="M 8.5 1.28 L 8.5 1.72 M 8.32 1.56 L 8.5 1.74 L 8.68 1.56"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={0.09}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Yellow start (8,13) pointing left */}
          <path
            d="M 13.72 8.5 L 13.28 8.5 M 13.44 8.32 L 13.26 8.5 L 13.44 8.68"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={0.09}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Blue start (13,6) pointing up */}
          <path
            d="M 6.5 13.72 L 6.5 13.28 M 6.32 13.44 L 6.5 13.26 L 6.68 13.44"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={0.09}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 4 Corner Yards */}
          {(
            [
              { color: 'red' as PlayerColor, x: 0, y: 0 },
              { color: 'green' as PlayerColor, x: 9, y: 0 },
              { color: 'yellow' as PlayerColor, x: 9, y: 9 },
              { color: 'blue' as PlayerColor, x: 0, y: 9 },
            ] as const
          ).map(({ color, x, y }) => {
            const meta = HOUSE_META[color];
            const isTurn = activeColor === color;
            return (
              <g key={`yard-${color}`}>
                <rect
                  x={x}
                  y={y}
                  width={6}
                  height={6}
                  fill={meta.fill}
                  stroke="#2d1d14"
                  strokeWidth={0.06}
                />
                {/* Recessed Ivory Yard Plate */}
                <rect
                  x={x + 0.85}
                  y={y + 0.85}
                  width={4.3}
                  height={4.3}
                  rx={0.45}
                  fill="#FAF6EE"
                  stroke={isTurn ? '#FDE68A' : 'rgba(0,0,0,0.18)'}
                  strokeWidth={isTurn ? 0.12 : 0.06}
                />
                {/* 4 Circular Token Pads */}
                {YARD_SLOTS[color].map(([r, c], idx) => (
                  <circle
                    key={`pad-${color}-${idx}`}
                    cx={c + 0.5}
                    cy={r + 0.5}
                    r={0.56}
                    fill={meta.tint}
                    stroke={meta.fill}
                    strokeWidth={0.08}
                  />
                ))}
              </g>
            );
          })}

          {/* Center 3x3 Home Goal Triangles */}
          <g>
            {/* Red Left Triangle */}
            <polygon
              points="6,6 6,9 7.5,7.5"
              fill={HOUSE_META.red.fill}
              stroke="#2d1d14"
              strokeWidth={0.05}
            />
            {/* Green Top Triangle */}
            <polygon
              points="6,6 9,6 7.5,7.5"
              fill={HOUSE_META.green.fill}
              stroke="#2d1d14"
              strokeWidth={0.05}
            />
            {/* Yellow Right Triangle */}
            <polygon
              points="9,6 9,9 7.5,7.5"
              fill={HOUSE_META.yellow.fill}
              stroke="#2d1d14"
              strokeWidth={0.05}
            />
            {/* Blue Bottom Triangle */}
            <polygon
              points="6,9 9,9 7.5,7.5"
              fill={HOUSE_META.blue.fill}
              stroke="#2d1d14"
              strokeWidth={0.05}
            />
            {/* Center Medallion */}
            <circle
              cx={7.5}
              cy={7.5}
              r={0.42}
              fill="#FAF6EE"
              stroke="#2d1d14"
              strokeWidth={0.06}
            />
            <circle cx={7.5} cy={7.5} r={0.2} fill="#B45309" />
          </g>
        </svg>

        {/* Destination Preview Ring on Hover */}
        {hoveredDest && (
          <div
            className="pointer-events-none absolute z-10 h-[6.1%] w-[6.1%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed transition-all duration-100"
            style={{
              left: `${hoveredDest.leftPct}%`,
              top: `${hoveredDest.topPct}%`,
              borderColor: hoveredDest.isCapture ? '#DC2626' : HOUSE_META[hoveredDest.color].dark,
              backgroundColor: hoveredDest.isCapture
                ? 'rgba(220, 38, 38, 0.18)'
                : 'rgba(250, 204, 21, 0.22)',
            }}
          />
        )}

        {/* Capture Burst Effects */}
        {captureEffects.map((fx) => (
          <div
            key={fx.id}
            className="pointer-events-none absolute z-20 h-[6.5%] w-[6.5%] rounded-full border-4 animate-capture-burst"
            style={{
              left: `${((fx.col + 0.5) / 15) * 100}%`,
              top: `${((fx.row + 0.5) / 15) * 100}%`,
              borderColor: HOUSE_META[fx.color].fill,
            }}
          />
        ))}

        {/* Interactive Tokens */}
        {positionedTokens.map(({ token, leftPct, topPct, scale }) => {
          const move = validMoveMap.get(token.id);
          const isMovable = canSelectToken && Boolean(move);
          const isAnimating = animatingTokenId === token.id;
          const meta = HOUSE_META[token.color];

          return (
            <button
              key={token.id}
              type="button"
              disabled={!isMovable}
              onClick={() => {
                if (move && isMovable) {
                  setHoveredMove(null);
                  onSelectMove(move);
                }
              }}
              onMouseEnter={() => {
                if (move && isMovable) setHoveredMove(move);
              }}
              onMouseLeave={() => setHoveredMove(null)}
              aria-label={`${meta.en} token ${token.index + 1}`}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: '5.5%',
                height: '5.5%',
                transform: `translate(-50%, -50%) scale(${
                  isAnimating ? scale * 1.16 : isMovable ? scale * 1.08 : scale
                })`,
                zIndex: isAnimating ? 40 : isMovable ? 30 : token.progress === 56 ? 12 : 20,
              }}
              className={`absolute flex items-center justify-center rounded-full transition-[left,top,transform] duration-100 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                isMovable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Pulsing valid-move halo */}
              {isMovable && (
                <span
                  className="pointer-events-none absolute inset-[-22%] rounded-full border-[2.5px] animate-token-pulse"
                  style={{ borderColor: '#1E1410' }}
                />
              )}

              {/* Sculpted Enamel & Brass Pawn */}
              <span
                className="relative flex h-full w-full items-center justify-center rounded-full shadow-[0_3px_6px_rgba(0,0,0,0.48),inset_0_2px_3px_rgba(255,255,255,0.45)] ring-2 ring-[#faf6ee]"
                style={{
                  background: `radial-gradient(circle at 32% 28%, ${meta.light}, ${meta.fill} 58%, ${meta.dark} 100%)`,
                }}
              >
                <span className="h-[46%] w-[46%] rounded-full border border-white/60 bg-white/15" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
