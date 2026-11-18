import React from 'react';
import { Bot, Play, User, X } from 'lucide-react';
import { HOUSE_META, UI_COPY } from '../game/constants';
import { createInitialTokens } from '../game/engine';
import { Language, PlayerColor, PlayerConfig, SeatType } from '../game/types';
import { LudoBoard } from './LudoBoard';

interface TitleScreenProps {
  players: PlayerConfig[];
  lang: Language;
  autoMoveSingle: boolean;
  onChangeLang: (lang: Language) => void;
  onToggleAutoMove: () => void;
  onUpdateSeat: (color: PlayerColor, seat: SeatType) => void;
  onApplyPreset: (preset: 'solo' | 'duel' | 'pass4') => void;
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  players,
  lang,
  autoMoveSingle,
  onChangeLang,
  onToggleAutoMove,
  onUpdateSeat,
  onApplyPreset,
  onStart,
}) => {
  const copy = UI_COPY[lang];
  const activeCount = players.filter((p) => p.seat !== 'off').length;
  const canStart = activeCount >= 2;
  const previewTokens = React.useMemo(() => createInitialTokens(players), [players]);

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-[1320px] flex-col items-center justify-center gap-6 px-4 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-10">
      {/* Live Tabletop Board Preview */}
      <div className="hidden lg:flex lg:w-[54%] items-center justify-center">
        <div className="w-full max-w-[540px] opacity-95">
          <LudoBoard
            tokens={previewTokens}
            validMoves={[]}
            activeColor="red"
            canSelectToken={false}
            animatingTokenId={null}
            captureEffects={[]}
            onSelectMove={() => {}}
          />
        </div>
      </div>

      {/* Dedicated Match Setup & Title Panel */}
      <div className="w-full max-w-[460px] rounded-2xl bg-[#221610]/92 p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.65)] ring-1 ring-amber-200/15">
        {/* Top Row: Bespoke Crest + Language Switch */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <svg
              viewBox="0 0 48 48"
              className="h-11 w-11 shrink-0"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="2"
                width="44"
                height="44"
                rx="10"
                fill="#2E1E15"
                stroke="#D97706"
                strokeWidth="2"
              />
              <polygon points="24,24 10,10 10,38" fill="#DC2626" />
              <polygon points="24,24 10,10 38,10" fill="#15803D" />
              <polygon points="24,24 38,10 38,38" fill="#D97706" />
              <polygon points="24,24 10,38 38,38" fill="#1D4ED8" />
              <circle cx="24" cy="24" r="5" fill="#FAF6EE" stroke="#2E1E15" strokeWidth="1.5" />
            </svg>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[#faf3ea]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {copy.title}
              </h1>
            </div>
          </div>

          <div
            className="flex items-center rounded-lg bg-[#160e0a] p-0.5 ring-1 ring-white/10 shrink-0"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                lang === 'en'
                  ? 'bg-[#3d281c] text-[#fde68a]'
                  : 'text-[#b5a391] hover:text-[#faf3ea]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('bn')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                lang === 'bn'
                  ? 'bg-[#3d281c] text-[#fde68a]'
                  : 'text-[#b5a391] hover:text-[#faf3ea]'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#cbbba9]">{copy.subtitle}</p>

        {/* Quick Mode Presets */}
        <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl bg-[#160e0a] p-1 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => onApplyPreset('solo')}
            className="rounded-lg px-2 py-2 text-xs font-medium text-[#e7dacb] hover:bg-[#2c1d15] transition-colors whitespace-nowrap truncate"
          >
            {copy.soloBots}
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('duel')}
            className="rounded-lg px-2 py-2 text-xs font-medium text-[#e7dacb] hover:bg-[#2c1d15] transition-colors whitespace-nowrap truncate"
          >
            {copy.duel2P}
          </button>
          <button
            type="button"
            onClick={() => onApplyPreset('pass4')}
            className="rounded-lg px-2 py-2 text-xs font-medium text-[#e7dacb] hover:bg-[#2c1d15] transition-colors whitespace-nowrap truncate"
          >
            {copy.passPlay4P}
          </button>
        </div>

        {/* Seat Assignments */}
        <div className="mt-4 divide-y divide-white/8 rounded-xl bg-[#18100c]/80 ring-1 ring-white/10">
          {players.map((p) => {
            const meta = HOUSE_META[p.color];
            const houseName = lang === 'bn' ? meta.bn : meta.en;
            return (
              <div
                key={p.color}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-[#faf6ee]/80"
                    style={{ backgroundColor: meta.fill }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-[#f5efe6] truncate">
                    {houseName}
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-[#241811] p-0.5 shrink-0">
                  {(['human', 'bot', 'off'] as SeatType[]).map((seatOption) => {
                    const active = p.seat === seatOption;
                    const label =
                      seatOption === 'human'
                        ? copy.human
                        : seatOption === 'bot'
                          ? copy.bot
                          : copy.off;
                    return (
                      <button
                        key={seatOption}
                        type="button"
                        onClick={() => onUpdateSeat(p.color, seatOption)}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-[#463022] text-[#fde68a] shadow-sm'
                            : 'text-[#a39282] hover:text-[#f5efe6]'
                        }`}
                      >
                        {seatOption === 'human' && <User className="h-3 w-3" />}
                        {seatOption === 'bot' && <Bot className="h-3 w-3" />}
                        {seatOption === 'off' && <X className="h-3 w-3" />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Auto-move single choice option */}
        <label className="mt-4 flex cursor-pointer items-center justify-between text-xs text-[#cbbba9]">
          <span>{copy.autoMove}</span>
          <input
            type="checkbox"
            checked={autoMoveSingle}
            onChange={onToggleAutoMove}
            className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
          />
        </label>

        {!canStart && (
          <p className="mt-3 text-xs font-medium text-red-400">{copy.needTwoPlayers}</p>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          disabled={!canStart}
          onClick={onStart}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-[#1a100a] shadow-lg transition-all duration-150 hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
        >
          <Play className="h-4 w-4 fill-current" />
          <span className="whitespace-nowrap">{copy.startMatch}</span>
        </button>

        {/* Single flat control-hint line */}
        <p className="mt-4 text-center text-xs text-[#9c8a78]">{copy.controlHint}</p>
      </div>
    </div>
  );
};
