import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Pause, Volume2, VolumeX } from 'lucide-react';
import { PauseModal, RulesModal, VictoryModal } from './components/GameModals';
import { LudoBoard } from './components/LudoBoard';
import { PlayerPod } from './components/PlayerPod';
import { TitleScreen } from './components/TitleScreen';
import { HOUSE_META, TURN_ORDER, UI_COPY } from './game/constants';
import {
  buildStepPath,
  chooseBotMove,
  createInitialTokens,
  getProgressCoords,
  getValidMoves,
} from './game/engine';
import { soundEngine } from './game/sound';
import {
  CaptureEffect,
  GameState,
  Language,
  MoveOption,
  PlayerColor,
  PlayerConfig,
  PlayerStats,
  SeatType,
  Token,
  TurnPhase,
} from './game/types';

const TABLETOP_BG_URL = '/src/assets/images/ludo_tabletop_wood_1794993596729.jpg';

const INITIAL_PLAYERS: PlayerConfig[] = [
  { color: 'red', name: 'Crimson', seat: 'human' },
  { color: 'green', name: 'Emerald', seat: 'bot' },
  { color: 'yellow', name: 'Amber', seat: 'bot' },
  { color: 'blue', name: 'Sapphire', seat: 'bot' },
];

function createEmptyStats(): Record<PlayerColor, PlayerStats> {
  return {
    red: { captures: 0, sixesRolled: 0, finishedOrder: null },
    green: { captures: 0, sixesRolled: 0, finishedOrder: null },
    yellow: { captures: 0, sixesRolled: 0, finishedOrder: null },
    blue: { captures: 0, sixesRolled: 0, finishedOrder: null },
  };
}

type StatusKey =
  | 'rollDice'
  | 'chooseToken'
  | 'botThinking'
  | 'noMoves'
  | 'tripleSix'
  | 'capturedBonus'
  | 'goalBonus'
  | 'sixBonus';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [players, setPlayers] = useState<PlayerConfig[]>(INITIAL_PLAYERS);
  const [tokens, setTokens] = useState<Token[]>(() => createInitialTokens(INITIAL_PLAYERS));
  const [stats, setStats] = useState<Record<PlayerColor, PlayerStats>>(createEmptyStats);

  const [activeColor, setActiveColor] = useState<PlayerColor>('red');
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('WAIT_ROLL');
  const [diceValue, setDiceValue] = useState<number>(6);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [statusKey, setStatusKey] = useState<StatusKey>('rollDice');
  const [validMoves, setValidMoves] = useState<MoveOption[]>([]);
  const [animatingTokenId, setAnimatingTokenId] = useState<string | null>(null);
  const [captureEffects, setCaptureEffects] = useState<CaptureEffect[]>([]);
  const [winnerColor, setWinnerColor] = useState<PlayerColor | null>(null);

  const [muted, setMuted] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [autoMoveSingle, setAutoMoveSingle] = useState<boolean>(true);
  const [bgLoaded, setBgLoaded] = useState<boolean>(true);

  const copy = UI_COPY[lang];
  const statusMessage = copy[statusKey];

  // Track active timeouts so restarting or returning to menu never leaves stale timers
  const timersRef = useRef<number[]>([]);
  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const activeSeatOrder = useMemo(
    () => TURN_ORDER.filter((c) => players.find((p) => p.color === c)?.seat !== 'off'),
    [players]
  );

  const activePlayer = useMemo(
    () => players.find((p) => p.color === activeColor) ?? players[0],
    [players, activeColor]
  );

  const getNextActiveColor = useCallback(
    (current: PlayerColor): PlayerColor => {
      if (activeSeatOrder.length === 0) return 'red';
      const idx = activeSeatOrder.indexOf(current);
      return activeSeatOrder[(idx + 1) % activeSeatOrder.length];
    },
    [activeSeatOrder]
  );

  const startNewMatch = useCallback(
    (customPlayers?: PlayerConfig[]) => {
      clearAllTimers();
      const targetPlayers = customPlayers ?? players;
      const order = TURN_ORDER.filter(
        (c) => targetPlayers.find((p) => p.color === c)?.seat !== 'off'
      );
      if (order.length < 2) return;

      const firstColor = order[0];
      setTokens(createInitialTokens(targetPlayers));
      setStats(createEmptyStats());
      setActiveColor(firstColor);
      setTurnPhase('WAIT_ROLL');
      setDiceValue(6);
      setConsecutiveSixes(0);
      setTurnNumber(1);
      setValidMoves([]);
      setAnimatingTokenId(null);
      setCaptureEffects([]);
      setWinnerColor(null);
      setShowRules(false);
      setStatusKey(
        targetPlayers.find((p) => p.color === firstColor)?.seat === 'bot'
          ? 'botThinking'
          : 'rollDice'
      );
      setGameState('PLAYING');
      soundEngine.playUiClick();
    },
    [clearAllTimers, players]
  );

  const handleUpdateSeat = useCallback((color: PlayerColor, seat: SeatType) => {
    soundEngine.playUiClick();
    setPlayers((prev) =>
      prev.map((p) => (p.color === color ? { ...p, seat } : p))
    );
  }, []);

  const handleApplyPreset = useCallback((preset: 'solo' | 'duel' | 'pass4') => {
    soundEngine.playUiClick();
    if (preset === 'solo') {
      setPlayers([
        { color: 'red', name: 'Crimson', seat: 'human' },
        { color: 'green', name: 'Emerald', seat: 'bot' },
        { color: 'yellow', name: 'Amber', seat: 'bot' },
        { color: 'blue', name: 'Sapphire', seat: 'bot' },
      ]);
    } else if (preset === 'duel') {
      setPlayers([
        { color: 'red', name: 'Crimson', seat: 'human' },
        { color: 'green', name: 'Emerald', seat: 'off' },
        { color: 'yellow', name: 'Amber', seat: 'bot' },
        { color: 'blue', name: 'Sapphire', seat: 'off' },
      ]);
    } else {
      setPlayers([
        { color: 'red', name: 'Player 1', seat: 'human' },
        { color: 'green', name: 'Player 2', seat: 'human' },
        { color: 'yellow', name: 'Player 3', seat: 'human' },
        { color: 'blue', name: 'Player 4', seat: 'human' },
      ]);
    }
  }, []);

  const advanceTurn = useCallback(
    (nextColor: PlayerColor, key?: StatusKey) => {
      const nextPlayer = players.find((p) => p.color === nextColor);
      setActiveColor(nextColor);
      setConsecutiveSixes(0);
      setValidMoves([]);
      setTurnPhase('WAIT_ROLL');
      setTurnNumber((n) => n + 1);
      setStatusKey(key ?? (nextPlayer?.seat === 'bot' ? 'botThinking' : 'rollDice'));
    },
    [players]
  );

  const executeMove = useCallback(
    (move: MoveOption, currentRoll: number) => {
      setTurnPhase('ANIMATING_MOVE');
      setValidMoves([]);
      setAnimatingTokenId(move.tokenId);

      const movingToken = tokens.find((t) => t.id === move.tokenId);
      if (!movingToken) return;

      const steps = buildStepPath(move.fromProgress, move.toProgress);
      const stepDelay = move.exitsYard ? 160 : 95;

      steps.forEach((stepProgress, idx) => {
        scheduleTimer(() => {
          setTokens((prev) =>
            prev.map((t) =>
              t.id === move.tokenId ? { ...t, progress: stepProgress } : t
            )
          );
          if (move.exitsYard && idx === 0) {
            soundEngine.playTokenExit();
          } else {
            soundEngine.playTokenHop(idx);
          }

          // Final step resolution
          if (idx === steps.length - 1) {
            scheduleTimer(() => {
              setAnimatingTokenId(null);

              let updatedTokens = tokens.map((t) =>
                t.id === move.tokenId ? { ...t, progress: move.toProgress } : t
              );

              // Apply captures
              if (move.captures.length > 0) {
                const captureSet = new Set(move.captures);
                updatedTokens = updatedTokens.map((t) =>
                  captureSet.has(t.id) ? { ...t, progress: -1 } : t
                );
                setTokens(updatedTokens);
                setStats((prev) => ({
                  ...prev,
                  [movingToken.color]: {
                    ...prev[movingToken.color],
                    captures: prev[movingToken.color].captures + move.captures.length,
                  },
                }));

                const [fxRow, fxCol] = getProgressCoords(
                  movingToken.color,
                  movingToken.index,
                  move.toProgress
                );
                const fxId = Date.now() + Math.random();
                setCaptureEffects((prev) => [
                  ...prev,
                  { id: fxId, row: fxRow, col: fxCol, color: movingToken.color },
                ]);
                scheduleTimer(() => {
                  setCaptureEffects((prev) => prev.filter((e) => e.id !== fxId));
                }, 420);

                soundEngine.playCapture();
              } else if (move.reachesGoal) {
                soundEngine.playHomeGoal();
              }

              // Check win condition: all 4 tokens of moving color at progress 56
              const finishedCount = updatedTokens.filter(
                (t) => t.color === movingToken.color && t.progress === 56
              ).length;

              if (finishedCount === 4) {
                setWinnerColor(movingToken.color);
                setGameState('GAME_OVER');
                soundEngine.playVictory();
                return;
              }

              // Bonus turn check
              const hasBonus =
                currentRoll === 6 ||
                move.captures.length > 0 ||
                move.reachesGoal;

              if (hasBonus) {
                setTurnPhase('WAIT_ROLL');
                setStatusKey(
                  move.captures.length > 0
                    ? 'capturedBonus'
                    : move.reachesGoal
                      ? 'goalBonus'
                      : 'sixBonus'
                );
              } else {
                const nextColor = getNextActiveColor(movingToken.color);
                advanceTurn(nextColor);
              }
            }, 90);
          }
        }, idx * stepDelay);
      });
    },
    [
      advanceTurn,
      getNextActiveColor,
      scheduleTimer,
      tokens,
    ]
  );

  const handleRollDice = useCallback(() => {
    if (gameState !== 'PLAYING' || turnPhase !== 'WAIT_ROLL') return;

    setTurnPhase('ROLLING');
    soundEngine.playDiceRoll();

    const rolled = Math.floor(Math.random() * 6) + 1;

    scheduleTimer(() => {
      setDiceValue(rolled);
      const nextSixCount = rolled === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixCount);

      if (rolled === 6) {
        setStats((prev) => ({
          ...prev,
          [activeColor]: {
            ...prev[activeColor],
            sixesRolled: prev[activeColor].sixesRolled + 1,
          },
        }));
      }

      // Triple 6 forfeit rule
      if (nextSixCount >= 3) {
        setStatusKey('tripleSix');
        setTurnPhase('TURN_TRANSITION');
        scheduleTimer(() => {
          advanceTurn(getNextActiveColor(activeColor));
        }, 850);
        return;
      }

      const moves = getValidMoves(tokens, activeColor, rolled);
      if (moves.length === 0) {
        setStatusKey('noMoves');
        setTurnPhase('TURN_TRANSITION');
        scheduleTimer(() => {
          advanceTurn(getNextActiveColor(activeColor));
        }, 720);
        return;
      }

      setValidMoves(moves);
      setTurnPhase('SELECT_TOKEN');
      setStatusKey(activePlayer.seat === 'bot' ? 'botThinking' : 'chooseToken');
    }, 300);
  }, [
    activeColor,
    activePlayer.seat,
    advanceTurn,
    consecutiveSixes,
    gameState,
    getNextActiveColor,
    scheduleTimer,
    tokens,
    turnPhase,
  ]);

  // Bot turn driver + optional auto-move for single human choice
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    if (activePlayer.seat === 'bot') {
      if (turnPhase === 'WAIT_ROLL') {
        const id = scheduleTimer(() => {
          handleRollDice();
        }, 520);
        return () => window.clearTimeout(id);
      }
      if (turnPhase === 'SELECT_TOKEN' && validMoves.length > 0) {
        const id = scheduleTimer(() => {
          const chosen = chooseBotMove(tokens, activeColor, validMoves);
          executeMove(chosen, diceValue);
        }, 420);
        return () => window.clearTimeout(id);
      }
    } else if (
      activePlayer.seat === 'human' &&
      autoMoveSingle &&
      turnPhase === 'SELECT_TOKEN' &&
      validMoves.length === 1
    ) {
      const id = scheduleTimer(() => {
        executeMove(validMoves[0], diceValue);
      }, 220);
      return () => window.clearTimeout(id);
    }
  }, [
    activeColor,
    activePlayer.seat,
    autoMoveSingle,
    diceValue,
    executeMove,
    gameState,
    handleRollDice,
    scheduleTimer,
    tokens,
    turnPhase,
    validMoves,
  ]);

  // Keyboard shortcuts: Space/Enter to roll or start, Esc to pause, 1-4 to pick token
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRules) {
          setShowRules(false);
          return;
        }
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      if (gameState === 'TITLE_MENU' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startNewMatch();
        return;
      }

      if (gameState !== 'PLAYING' || showRules) return;

      if (
        (e.key === ' ' || e.key === 'Enter') &&
        activePlayer.seat === 'human' &&
        turnPhase === 'WAIT_ROLL'
      ) {
        e.preventDefault();
        handleRollDice();
        return;
      }

      if (
        activePlayer.seat === 'human' &&
        turnPhase === 'SELECT_TOKEN' &&
        ['1', '2', '3', '4'].includes(e.key)
      ) {
        const idx = Number(e.key) - 1;
        const targetId = `${activeColor}-${idx}`;
        const match = validMoves.find((m) => m.tokenId === targetId);
        if (match) {
          executeMove(match, diceValue);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeColor,
    activePlayer.seat,
    diceValue,
    executeMove,
    gameState,
    handleRollDice,
    showRules,
    startNewMatch,
    turnPhase,
    validMoves,
  ]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const redPlayer = players.find((p) => p.color === 'red')!;
  const greenPlayer = players.find((p) => p.color === 'green')!;
  const yellowPlayer = players.find((p) => p.color === 'yellow')!;
  const bluePlayer = players.find((p) => p.color === 'blue')!;

  const seatNumberFor = (color: PlayerColor) => {
    const idx = activeSeatOrder.indexOf(color);
    return idx >= 0 ? idx + 1 : undefined;
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#18100b] text-[#faf3ea]">
      {/* Carved Teakwood Tabletop Backdrop */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {bgLoaded && (
          <img
            src={TABLETOP_BG_URL}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBgLoaded(false)}
            className="h-full w-full object-cover opacity-45"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 48%, rgba(28,18,12,0.35) 0%, rgba(16,10,7,0.88) 100%)',
          }}
        />
      </div>

      {gameState === 'TITLE_MENU' ? (
        <TitleScreen
          players={players}
          lang={lang}
          autoMoveSingle={autoMoveSingle}
          onChangeLang={(next) => {
            soundEngine.playUiClick();
            setLang(next);
          }}
          onToggleAutoMove={() => {
            soundEngine.playUiClick();
            setAutoMoveSingle((v) => !v);
          }}
          onUpdateSeat={handleUpdateSeat}
          onApplyPreset={handleApplyPreset}
          onStart={() => startNewMatch()}
        />
      ) : (
        <div className="relative z-10 flex h-full w-full flex-col justify-between px-3 py-2.5 sm:px-6 sm:py-3">
          {/* Compact Top Utility HUD */}
          <header className="mx-auto flex w-full max-w-[1340px] items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="text-base sm:text-lg font-bold tracking-tight text-[#faf3ea] whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {copy.title}
              </span>
              <span className="text-xs text-[#cbbba9] font-mono tabular-nums whitespace-nowrap">
                {copy.turnLabel} {turnNumber}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
                className="rounded-lg bg-[#261a13]/90 px-2.5 py-1.5 text-xs font-medium text-[#e7dacb] ring-1 ring-white/10 hover:bg-[#35241b] transition-colors cursor-pointer whitespace-nowrap"
              >
                {lang === 'en' ? 'বাংলা' : 'EN'}
              </button>
              <button
                type="button"
                onClick={() => setShowRules(true)}
                aria-label={copy.rules}
                className="flex items-center gap-1.5 rounded-lg bg-[#261a13]/90 px-2.5 py-1.5 text-xs font-medium text-[#e7dacb] ring-1 ring-white/10 hover:bg-[#35241b] transition-colors cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{copy.rules}</span>
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? copy.unmute : copy.mute}
                className="flex items-center justify-center rounded-lg bg-[#261a13]/90 p-1.5 text-[#e7dacb] ring-1 ring-white/10 hover:bg-[#35241b] transition-colors cursor-pointer"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setGameState('PAUSED')}
                aria-label={copy.paused}
                className="flex items-center gap-1.5 rounded-lg bg-[#261a13]/90 px-2.5 py-1.5 text-xs font-medium text-[#e7dacb] ring-1 ring-white/10 hover:bg-[#35241b] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pause className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Esc</span>
              </button>
            </div>
          </header>

          {/* Main Tabletop Arena: Symmetric Corner Pods + Center 15x15 Board */}
          <main className="mx-auto flex w-full max-w-[1340px] flex-1 flex-col items-center justify-center gap-2.5 lg:grid lg:grid-cols-[260px_minmax(0,1fr)_260px] lg:items-center lg:gap-6 min-h-0 py-1">
            {/* Mobile Top Row (Red & Green) */}
            <div className="grid w-full max-w-[540px] grid-cols-2 gap-2 lg:hidden">
              <PlayerPod
                player={redPlayer}
                seatNumber={seatNumberFor('red')}
                tokens={tokens}
                stats={stats.red}
                isActive={activeColor === 'red'}
                turnPhase={turnPhase}
                diceValue={diceValue}
                lang={lang}
                statusMessage={statusMessage}
                rollLabel={copy.rollDice}
                capturesLabel={copy.capturesLabel}
                humanLabel={copy.human}
                botLabel={copy.bot}
                onRoll={handleRollDice}
              />
              <PlayerPod
                player={greenPlayer}
                seatNumber={seatNumberFor('green')}
                tokens={tokens}
                stats={stats.green}
                isActive={activeColor === 'green'}
                turnPhase={turnPhase}
                diceValue={diceValue}
                lang={lang}
                statusMessage={statusMessage}
                rollLabel={copy.rollDice}
                capturesLabel={copy.capturesLabel}
                humanLabel={copy.human}
                botLabel={copy.bot}
                onRoll={handleRollDice}
              />
            </div>

            {/* Desktop Left Flank (Red Top, Blue Bottom) */}
            <div className="hidden lg:flex lg:h-full lg:max-h-[min(80dvh,680px)] lg:flex-col lg:justify-between">
              <div>
                <PlayerPod
                  player={redPlayer}
                  seatNumber={seatNumberFor('red')}
                  tokens={tokens}
                  stats={stats.red}
                  isActive={activeColor === 'red'}
                  turnPhase={turnPhase}
                  diceValue={diceValue}
                  lang={lang}
                  statusMessage={statusMessage}
                  rollLabel={copy.rollDice}
                  capturesLabel={copy.capturesLabel}
                  humanLabel={copy.human}
                  botLabel={copy.bot}
                  onRoll={handleRollDice}
                />
              </div>
              <div>
                <PlayerPod
                  player={bluePlayer}
                  seatNumber={seatNumberFor('blue')}
                  tokens={tokens}
                  stats={stats.blue}
                  isActive={activeColor === 'blue'}
                  turnPhase={turnPhase}
                  diceValue={diceValue}
                  lang={lang}
                  statusMessage={statusMessage}
                  rollLabel={copy.rollDice}
                  capturesLabel={copy.capturesLabel}
                  humanLabel={copy.human}
                  botLabel={copy.bot}
                  onRoll={handleRollDice}
                />
              </div>
            </div>

            {/* Centerpiece 15x15 Ludo Board */}
            <div className="flex w-full items-center justify-center min-h-0">
              <LudoBoard
                tokens={tokens}
                validMoves={validMoves}
                activeColor={activeColor}
                canSelectToken={
                  gameState === 'PLAYING' &&
                  activePlayer.seat === 'human' &&
                  turnPhase === 'SELECT_TOKEN'
                }
                animatingTokenId={animatingTokenId}
                captureEffects={captureEffects}
                onSelectMove={(move) => executeMove(move, diceValue)}
              />
            </div>

            {/* Desktop Right Flank (Green Top, Yellow Bottom) */}
            <div className="hidden lg:flex lg:h-full lg:max-h-[min(80dvh,680px)] lg:flex-col lg:justify-between">
              <div>
                <PlayerPod
                  player={greenPlayer}
                  seatNumber={seatNumberFor('green')}
                  tokens={tokens}
                  stats={stats.green}
                  isActive={activeColor === 'green'}
                  turnPhase={turnPhase}
                  diceValue={diceValue}
                  lang={lang}
                  statusMessage={statusMessage}
                  rollLabel={copy.rollDice}
                  capturesLabel={copy.capturesLabel}
                  humanLabel={copy.human}
                  botLabel={copy.bot}
                  onRoll={handleRollDice}
                />
              </div>
              <div>
                <PlayerPod
                  player={yellowPlayer}
                  seatNumber={seatNumberFor('yellow')}
                  tokens={tokens}
                  stats={stats.yellow}
                  isActive={activeColor === 'yellow'}
                  turnPhase={turnPhase}
                  diceValue={diceValue}
                  lang={lang}
                  statusMessage={statusMessage}
                  rollLabel={copy.rollDice}
                  capturesLabel={copy.capturesLabel}
                  humanLabel={copy.human}
                  botLabel={copy.bot}
                  onRoll={handleRollDice}
                />
              </div>
            </div>

            {/* Mobile Bottom Row (Blue & Yellow) */}
            <div className="grid w-full max-w-[540px] grid-cols-2 gap-2 lg:hidden">
              <PlayerPod
                player={bluePlayer}
                seatNumber={seatNumberFor('blue')}
                tokens={tokens}
                stats={stats.blue}
                isActive={activeColor === 'blue'}
                turnPhase={turnPhase}
                diceValue={diceValue}
                lang={lang}
                statusMessage={statusMessage}
                rollLabel={copy.rollDice}
                capturesLabel={copy.capturesLabel}
                humanLabel={copy.human}
                botLabel={copy.bot}
                onRoll={handleRollDice}
              />
              <PlayerPod
                player={yellowPlayer}
                seatNumber={seatNumberFor('yellow')}
                tokens={tokens}
                stats={stats.yellow}
                isActive={activeColor === 'yellow'}
                turnPhase={turnPhase}
                diceValue={diceValue}
                lang={lang}
                statusMessage={statusMessage}
                rollLabel={copy.rollDice}
                capturesLabel={copy.capturesLabel}
                humanLabel={copy.human}
                botLabel={copy.bot}
                onRoll={handleRollDice}
              />
            </div>
          </main>

          {/* Subtle single-line footer hint on desktop */}
          <footer className="hidden lg:flex items-center justify-center text-xs text-[#9c8a78]">
            <span>
              {lang === 'bn' ? HOUSE_META[activeColor].bn : HOUSE_META[activeColor].en}
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>{copy.controlHint}</span>
          </footer>
        </div>
      )}

      {/* Modals */}
      {gameState === 'PAUSED' && (
        <PauseModal
          lang={lang}
          onResume={() => setGameState('PLAYING')}
          onRestart={() => startNewMatch()}
          onMainMenu={() => {
            clearAllTimers();
            setGameState('TITLE_MENU');
          }}
        />
      )}

      {showRules && <RulesModal lang={lang} onClose={() => setShowRules(false)} />}

      {gameState === 'GAME_OVER' && winnerColor && (
        <VictoryModal
          lang={lang}
          winnerColor={winnerColor}
          players={players}
          tokens={tokens}
          stats={stats}
          onPlayAgain={() => startNewMatch()}
          onMainMenu={() => {
            clearAllTimers();
            setGameState('TITLE_MENU');
          }}
        />
      )}
    </div>
  );
}
