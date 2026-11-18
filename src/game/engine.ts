import {
  GOAL_SLOTS,
  HOME_STRETCH_COORDS,
  HOUSE_META,
  RING_COORDS,
  SAFE_RING_INDICES,
  YARD_SLOTS,
} from './constants';
import { MoveOption, PlayerColor, PlayerConfig, Token } from './types';

export function createInitialTokens(players: PlayerConfig[]): Token[] {
  const activeColors = players.filter((p) => p.seat !== 'off').map((p) => p.color);
  const tokens: Token[] = [];
  for (const color of activeColors) {
    for (let i = 0; i < 4; i++) {
      tokens.push({
        id: `${color}-${i}`,
        color,
        index: i,
        progress: -1,
      });
    }
  }
  return tokens;
}

export function getTokenRingIndex(color: PlayerColor, progress: number): number | null {
  if (progress < 0 || progress > 50) return null;
  const start = HOUSE_META[color].startRingIndex;
  return (start + progress) % 52;
}

export function getProgressCoords(
  color: PlayerColor,
  index: number,
  progress: number
): readonly [number, number] {
  if (progress < 0) {
    return YARD_SLOTS[color][index];
  }
  if (progress <= 50) {
    const ringIdx = (HOUSE_META[color].startRingIndex + progress) % 52;
    return RING_COORDS[ringIdx];
  }
  if (progress <= 55) {
    return HOME_STRETCH_COORDS[color][progress - 51];
  }
  return GOAL_SLOTS[color][index];
}

export function getTokenCoords(token: Token): readonly [number, number] {
  return getProgressCoords(token.color, token.index, token.progress);
}

export function buildStepPath(fromProgress: number, toProgress: number): number[] {
  if (fromProgress < 0 && toProgress === 0) {
    return [0];
  }
  const steps: number[] = [];
  for (let p = fromProgress + 1; p <= toProgress; p++) {
    steps.push(p);
  }
  return steps;
}

export function getValidMoves(
  tokens: Token[],
  color: PlayerColor,
  diceValue: number
): MoveOption[] {
  const myTokens = tokens.filter((t) => t.color === color);
  const options: MoveOption[] = [];

  for (const token of myTokens) {
    if (token.progress === 56) continue;

    let toProgress: number | null = null;
    if (token.progress === -1) {
      if (diceValue === 6) {
        toProgress = 0;
      }
    } else {
      const candidate = token.progress + diceValue;
      if (candidate <= 56) {
        toProgress = candidate;
      }
    }

    if (toProgress === null) continue;

    // Check captures if landing on outer ring
    const captures: string[] = [];
    if (toProgress >= 0 && toProgress <= 50) {
      const destRing = getTokenRingIndex(color, toProgress);
      if (destRing !== null && !SAFE_RING_INDICES.has(destRing)) {
        for (const other of tokens) {
          if (other.color === color) continue;
          const otherRing = getTokenRingIndex(other.color, other.progress);
          if (otherRing === destRing) {
            captures.push(other.id);
          }
        }
      }
    }

    options.push({
      tokenId: token.id,
      fromProgress: token.progress,
      toProgress,
      captures,
      reachesGoal: toProgress === 56,
      exitsYard: token.progress === -1 && toProgress === 0,
    });
  }

  return options;
}

function countThreatsAtRing(
  tokens: Token[],
  myColor: PlayerColor,
  ringIdx: number
): number {
  if (SAFE_RING_INDICES.has(ringIdx)) return 0;
  let threats = 0;
  for (const other of tokens) {
    if (other.color === myColor) continue;
    const otherRing = getTokenRingIndex(other.color, other.progress);
    if (otherRing === null) continue;
    const dist = (ringIdx - otherRing + 52) % 52;
    if (dist >= 1 && dist <= 6) {
      threats++;
    }
  }
  return threats;
}

export function chooseBotMove(
  tokens: Token[],
  color: PlayerColor,
  moves: MoveOption[]
): MoveOption {
  if (moves.length === 1) return moves[0];

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    let score = 0;

    if (move.reachesGoal) score += 140;
    if (move.captures.length > 0) score += 115 * move.captures.length;
    if (move.exitsYard) score += 62;

    const fromRing = getTokenRingIndex(color, move.fromProgress);
    const toRing = getTokenRingIndex(color, move.toProgress);

    // Escaping danger bonus
    if (fromRing !== null) {
      const currentThreats = countThreatsAtRing(tokens, color, fromRing);
      if (currentThreats > 0) {
        score += 55 * currentThreats;
      }
      if (SAFE_RING_INDICES.has(fromRing)) {
        score -= 18;
      }
    }

    // Destination safety & home stretch
    if (move.toProgress >= 51 && move.toProgress <= 55) {
      score += 52;
    } else if (toRing !== null) {
      if (SAFE_RING_INDICES.has(toRing)) {
        score += 48;
      } else {
        const destThreats = countThreatsAtRing(tokens, color, toRing);
        score -= 34 * destThreats;
      }
    }

    // Slight preference to advance further tokens
    score += Math.max(0, move.toProgress) * 0.45;
    // Tiny deterministic tiebreaker jitter
    score += Math.random() * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
