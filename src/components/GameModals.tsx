import React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { HOUSE_META, UI_COPY } from '../game/constants';
import { Language, PlayerColor, PlayerConfig, PlayerStats, Token } from '../game/types';

interface PauseModalProps {
  lang: Language;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  lang,
  onResume,
  onRestart,
  onMainMenu,
}) => {
  const copy = UI_COPY[lang];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.paused}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#241811] p-6 shadow-2xl ring-1 ring-amber-200/15">
        <h2
          className="text-xl font-bold text-[#faf3ea]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {copy.paused}
        </h2>
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#1a100a] hover:bg-amber-400 transition-colors cursor-pointer"
          >
            {copy.resume}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full rounded-xl bg-[#342319] px-4 py-2.5 text-sm font-medium text-[#f5efe6] hover:bg-[#432e21] transition-colors cursor-pointer"
          >
            {copy.restart}
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full rounded-xl bg-transparent px-4 py-2.5 text-sm font-medium text-[#c5b4a2] hover:bg-white/5 hover:text-[#faf3ea] transition-colors cursor-pointer"
          >
            {copy.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
};

interface RulesModalProps {
  lang: Language;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ lang, onClose }) => {
  const copy = UI_COPY[lang];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.rules}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#241811] p-6 shadow-2xl ring-1 ring-amber-200/15">
        <h2
          className="text-xl font-bold text-[#faf3ea]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {copy.rules}
        </h2>
        <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#d7c7b6]">
          {copy.rulesList.map((rule, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="font-mono text-xs font-semibold text-amber-400 mt-0.5 tabular-nums">
                0{i + 1}.
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#1a100a] hover:bg-amber-400 transition-colors cursor-pointer"
        >
          {copy.close}
        </button>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  lang: Language;
  winnerColor: PlayerColor;
  players: PlayerConfig[];
  tokens: Token[];
  stats: Record<PlayerColor, PlayerStats>;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  lang,
  winnerColor,
  players,
  tokens,
  stats,
  onPlayAgain,
  onMainMenu,
}) => {
  const copy = UI_COPY[lang];
  const winnerMeta = HOUSE_META[winnerColor];
  const winnerPlayer = players.find((p) => p.color === winnerColor);
  const winnerName =
    winnerPlayer?.name || (lang === 'bn' ? winnerMeta.bn : winnerMeta.en);

  const standings = players
    .filter((p) => p.seat !== 'off')
    .map((p) => {
      const homeCount = tokens.filter(
        (t) => t.color === p.color && t.progress === 56
      ).length;
      const totalProgress = tokens
        .filter((t) => t.color === p.color)
        .reduce((acc, t) => acc + Math.max(0, t.progress), 0);
      return {
        player: p,
        homeCount,
        totalProgress,
        captures: stats[p.color].captures,
      };
    })
    .sort((a, b) => {
      if (a.player.color === winnerColor) return -1;
      if (b.player.color === winnerColor) return 1;
      if (b.homeCount !== a.homeCount) return b.homeCount - a.homeCount;
      return b.totalProgress - a.totalProgress;
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.victoryTitle}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#241811] p-6 shadow-2xl ring-1 ring-amber-300/25">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-inner"
            style={{ backgroundColor: winnerMeta.fill }}
          >
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-300">{copy.victoryTitle}</p>
            <h2
              className="text-2xl font-bold text-[#faf3ea]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {winnerName}
            </h2>
          </div>
        </div>

        <div className="mt-5 divide-y divide-white/8 rounded-xl bg-[#18100c] ring-1 ring-white/10">
          {standings.map((row, idx) => {
            const meta = HOUSE_META[row.player.color];
            const label =
              row.player.name || (lang === 'bn' ? meta.bn : meta.en);
            return (
              <div
                key={row.player.color}
                className="flex items-center justify-between px-3.5 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-[#9c8a78] tabular-nums">
                    #{idx + 1}
                  </span>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: meta.fill }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-[#f5efe6]">{label}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs text-[#cbbba9] tabular-nums">
                  <span>
                    {copy.homeLabel}: {row.homeCount}/4
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {copy.capturesLabel}: {row.captures}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#1a100a] hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="whitespace-nowrap">{copy.playAgain}</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="rounded-xl bg-[#342319] px-4 py-2.5 text-sm font-medium text-[#f5efe6] hover:bg-[#432e21] transition-colors cursor-pointer whitespace-nowrap"
          >
            {copy.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
};
