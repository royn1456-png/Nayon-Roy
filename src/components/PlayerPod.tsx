import React from 'react';
import { Bot, User } from 'lucide-react';
import { HOUSE_META } from '../game/constants';
import { Language, PlayerConfig, PlayerStats, Token, TurnPhase } from '../game/types';
import { DiceTray } from './DiceTray';

interface PlayerPodProps {
  player: PlayerConfig;
  seatNumber?: number;
  tokens: Token[];
  stats: PlayerStats;
  isActive: boolean;
  turnPhase: TurnPhase;
  diceValue: number;
  lang: Language;
  statusMessage: string;
  rollLabel: string;
  capturesLabel: string;
  humanLabel: string;
  botLabel: string;
  onRoll: () => void;
}

export const PlayerPod: React.FC<PlayerPodProps> = ({
  player,
  seatNumber,
  tokens,
  stats,
  isActive,
  turnPhase,
  diceValue,
  lang,
  statusMessage,
  rollLabel,
  capturesLabel,
  humanLabel,
  botLabel,
  onRoll,
}) => {
  if (player.seat === 'off') return null;

  const meta = HOUSE_META[player.color];
  const houseLabel = lang === 'bn' ? meta.bn : meta.en;
  const myTokens = tokens.filter((t) => t.color === player.color);
  const canRoll = isActive && player.seat === 'human' && turnPhase === 'WAIT_ROLL';

  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-2xl p-3.5 transition-all duration-150 ${
        isActive
          ? 'bg-[#2a1c14]/95 shadow-[0_12px_28px_rgba(0,0,0,0.55)] ring-2'
          : 'bg-[#20150f]/85 ring-1 ring-white/10 opacity-80'
      }`}
      style={{
        borderColor: isActive ? meta.ring : undefined,
        boxShadow: isActive ? `0 0 0 1px ${meta.ring}, 0 12px 28px rgba(0,0,0,0.55)` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-inner"
            style={{ backgroundColor: meta.fill }}
            aria-hidden="true"
          >
            {player.seat === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {seatNumber !== undefined && (
                <span className="font-mono text-xs font-bold tabular-nums text-amber-300 shrink-0">
                  #{seatNumber}
                </span>
              )}
              <span className="truncate text-sm font-semibold text-[#faf3ea]">
                {player.name || houseLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#bba998]">
              <span>{houseLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{player.seat === 'bot' ? botLabel : humanLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {myTokens.map((t) => {
            const isHome = t.progress === 56;
            const isOut = t.progress >= 0 && t.progress < 56;
            return (
              <span
                key={t.id}
                title={isHome ? 'Home' : isOut ? 'On Board' : 'Yard'}
                className="h-2.5 w-2.5 rounded-full transition-transform duration-150"
                style={{
                  backgroundColor: isHome
                    ? '#FBBF24'
                    : isOut
                      ? meta.ring
                      : 'rgba(255,255,255,0.16)',
                  boxShadow: isHome ? '0 0 6px rgba(251,191,36,0.7)' : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#b8a594]">
        <span className="truncate">{isActive ? statusMessage : '—'}</span>
        <span className="font-mono tabular-nums shrink-0 ml-2">
          {capturesLabel}: {stats.captures}
        </span>
      </div>

      {isActive && (
        <DiceTray
          value={diceValue}
          rolling={turnPhase === 'ROLLING'}
          canRoll={canRoll}
          activeColor={player.color}
          onRoll={onRoll}
          label={
            player.seat === 'human'
              ? turnPhase === 'WAIT_ROLL'
                ? rollLabel
                : statusMessage
              : statusMessage
          }
        />
      )}
    </div>
  );
};
