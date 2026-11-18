import { Language, PlayerColor } from './types';

export const TURN_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const HOUSE_META: Record<
  PlayerColor,
  {
    en: string;
    bn: string;
    fill: string;
    dark: string;
    light: string;
    tint: string;
    ring: string;
    text: string;
    startRingIndex: number;
  }
> = {
  red: {
    en: 'Crimson',
    bn: 'লাল',
    fill: '#DC2626',
    dark: '#991B1B',
    light: '#FCA5A5',
    tint: '#FEE2E2',
    ring: '#EF4444',
    text: '#DC2626',
    startRingIndex: 0,
  },
  green: {
    en: 'Emerald',
    bn: 'সবুজ',
    fill: '#15803D',
    dark: '#14532D',
    light: '#86EFAC',
    tint: '#DCFCE7',
    ring: '#22C55E',
    text: '#15803D',
    startRingIndex: 13,
  },
  yellow: {
    en: 'Amber',
    bn: 'হলুদ',
    fill: '#D97706',
    dark: '#92400E',
    light: '#FDE047',
    tint: '#FEF3C7',
    ring: '#F59E0B',
    text: '#B45309',
    startRingIndex: 26,
  },
  blue: {
    en: 'Sapphire',
    bn: 'নীল',
    fill: '#1D4ED8',
    dark: '#1E3A8A',
    light: '#93C5FD',
    tint: '#DBEAFE',
    ring: '#3B82F6',
    text: '#1D4ED8',
    startRingIndex: 39,
  },
};

/**
 * 52-square clockwise outer ring in [row, col] on a 15x15 grid (0..14).
 * Index 0 is Red start (6, 1).
 * Index 13 is Green start (1, 8).
 * Index 26 is Yellow start (8, 13).
 * Index 39 is Blue start (13, 6).
 */
export const RING_COORDS: ReadonlyArray<readonly [number, number]> = [
  // Red arm top row moving right (0..4)
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  // Green arm left col moving up (5..10)
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6], // 8: Star safe
  [1, 6],
  [0, 6],
  // Top turn (11..12)
  [0, 7],
  [0, 8],
  // Green arm right col moving down (13..17)
  [1, 8], // 13: Green start (safe)
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  // Yellow arm top row moving right (18..23)
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12], // 21: Star safe
  [6, 13],
  [6, 14],
  // Right turn (24..25)
  [7, 14],
  [8, 14],
  // Yellow arm bottom row moving left (26..30)
  [8, 13], // 26: Yellow start (safe)
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  // Blue arm right col moving down (31..36)
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8], // 34: Star safe
  [13, 8],
  [14, 8],
  // Bottom turn (37..38)
  [14, 7],
  [14, 6],
  // Blue arm left col moving up (39..43)
  [13, 6], // 39: Blue start (safe)
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  // Red arm bottom row moving left (44..49)
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2], // 47: Star safe
  [8, 1],
  [8, 0],
  // Left turn (50..51)
  [7, 0],
  [6, 0],
];

export const SAFE_RING_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
export const STAR_RING_INDICES = new Set<number>([8, 21, 34, 47]);

export const HOME_STRETCH_COORDS: Record<PlayerColor, ReadonlyArray<readonly [number, number]>> = {
  red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
  ],
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
  ],
  yellow: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
  ],
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
  ],
};

/**
 * Exact 15x15 floating coordinates for the 4 tokens resting inside each 6x6 corner yard.
 * Placed cleanly inside the 2x2 inner token pads.
 */
export const YARD_SLOTS: Record<PlayerColor, ReadonlyArray<readonly [number, number]>> = {
  red: [
    [1.65, 1.65],
    [1.65, 3.35],
    [3.35, 1.65],
    [3.35, 3.35],
  ],
  green: [
    [1.65, 10.65],
    [1.65, 12.35],
    [3.35, 10.65],
    [3.35, 12.35],
  ],
  yellow: [
    [10.65, 10.65],
    [10.65, 12.35],
    [12.35, 10.65],
    [12.35, 12.35],
  ],
  blue: [
    [10.65, 1.65],
    [10.65, 3.35],
    [12.35, 1.65],
    [12.35, 3.35],
  ],
};

/**
 * Positions inside each color's triangle in the 3x3 center Home (rows 6..8, cols 6..8).
 */
export const GOAL_SLOTS: Record<PlayerColor, ReadonlyArray<readonly [number, number]>> = {
  red: [
    [6.65, 6.2],
    [7.35, 6.2],
    [7.0, 6.55],
    [7.0, 5.95],
  ],
  green: [
    [6.2, 6.65],
    [6.2, 7.35],
    [6.55, 7.0],
    [5.95, 7.0],
  ],
  yellow: [
    [6.65, 7.8],
    [7.35, 7.8],
    [7.0, 7.45],
    [7.0, 8.05],
  ],
  blue: [
    [7.8, 6.65],
    [7.8, 7.35],
    [7.45, 7.0],
    [8.05, 7.0],
  ],
};

export const UI_COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    startMatch: string;
    soloBots: string;
    duel2P: string;
    passPlay4P: string;
    human: string;
    bot: string;
    off: string;
    controlHint: string;
    rollDice: string;
    chooseToken: string;
    botThinking: string;
    noMoves: string;
    tripleSix: string;
    capturedBonus: string;
    goalBonus: string;
    sixBonus: string;
    paused: string;
    resume: string;
    restart: string;
    mainMenu: string;
    rules: string;
    mute: string;
    unmute: string;
    victoryTitle: string;
    playAgain: string;
    capturesLabel: string;
    homeLabel: string;
    turnLabel: string;
    rulesList: string[];
    close: string;
    needTwoPlayers: string;
    autoMove: string;
  }
> = {
  en: {
    title: 'Ludo Sovereign',
    subtitle: 'Classic carved-wood tabletop Ludo with smart bots and local pass-and-play.',
    startMatch: 'Start Match',
    soloBots: 'Solo vs 3 Bots',
    duel2P: '1v1 Duel',
    passPlay4P: '4P Pass & Play',
    human: 'Human',
    bot: 'Bot',
    off: 'Off',
    controlHint: 'Space Roll · Click Token Move · Esc Pause',
    rollDice: 'Roll Dice',
    chooseToken: 'Select a highlighted token',
    botThinking: 'Bot is rolling...',
    noMoves: 'No legal moves',
    tripleSix: 'Triple 6 — Turn forfeited',
    capturedBonus: 'Captured! Bonus roll',
    goalBonus: 'Token home! Bonus roll',
    sixBonus: 'Rolled a 6 — Bonus roll',
    paused: 'Match Paused',
    resume: 'Resume Match',
    restart: 'Restart Match',
    mainMenu: 'Title Screen',
    rules: 'Rules',
    mute: 'Mute Audio',
    unmute: 'Enable Audio',
    victoryTitle: 'Match Complete',
    playAgain: 'Play Again',
    capturesLabel: 'Captures',
    homeLabel: 'Home',
    turnLabel: 'Turn',
    close: 'Close',
    needTwoPlayers: 'Enable at least 2 active seats to start.',
    autoMove: 'Auto-move single choice',
    rulesList: [
      'Roll a 6 to bring a token out of your yard onto your colored start square.',
      'Rolling a 6, capturing an opponent, or reaching the center Home grants a bonus roll.',
      'Rolling three 6s in a row forfeits the turn.',
      'Colored start squares and star squares are safe zones — tokens there cannot be captured.',
      'Exact roll required to enter the center Home triangle. First player to get all 4 tokens home wins.',
    ],
  },
  bn: {
    title: 'লুডু আসর',
    subtitle: 'চিরায়ত কাঠের বোর্ডে স্মার্ট বট ও বন্ধুদের সাথে ক্লাসিক লুডু খেলা।',
    startMatch: 'খেলা শুরু করুন',
    soloBots: '১ জন বনাম ৩ বট',
    duel2P: '২ জনের দ্বৈত',
    passPlay4P: '৪ জন একসাথে',
    human: 'মানুষ',
    bot: 'বট',
    off: 'বন্ধ',
    controlHint: 'Space ছক্কা · গুটিতে ক্লিক চাল · Esc বিরতি',
    rollDice: 'ছক্কা চালুন',
    chooseToken: 'যেকোনো একটি বৈধ গুটি বাছুন',
    botThinking: 'বট খেলছে...',
    noMoves: 'কোনো বৈধ চাল নেই',
    tripleSix: 'টানা তিনবার ৬ — চাল বাতিল',
    capturedBonus: 'গুটি কাটা হয়েছে! বাড়তি চাল',
    goalBonus: 'ঘরে পৌঁছেছে! বাড়তি চাল',
    sixBonus: '৬ উঠেছে — বাড়তি চাল',
    paused: 'খেলা বিরতিতে',
    resume: 'খেলা চালিয়ে যান',
    restart: 'আবার শুরু করুন',
    mainMenu: 'মূল মেনু',
    rules: 'নিয়মাবলি',
    mute: 'শব্দ বন্ধ',
    unmute: 'শব্দ চালু',
    victoryTitle: 'বিজয়ী ঘোষণা',
    playAgain: 'আবার খেলুন',
    capturesLabel: 'কাটা গুটি',
    homeLabel: 'ঘরে',
    turnLabel: 'চাল',
    close: 'বন্ধ করুন',
    needTwoPlayers: 'খেলা শুরু করতে অন্তত ২টি ঘর চালু রাখুন।',
    autoMove: 'একমাত্র চাল স্বয়ংক্রিয় হবে',
    rulesList: [
      'ঘর থেকে গুটি বের করতে ছক্কায় ৬ তুলতে হবে।',
      '৬ উঠলে, বিপক্ষের গুটি কাটলে, অথবা গুটি পাকা ঘরে পৌঁছালে বাড়তি চাল পাওয়া যায়।',
      'পরপর তিনবার ৬ উঠলে সেই চাল বাতিল হয়ে যায়।',
      'তারকা চিহ্নিত ঘর এবং শুরুর রঙিন ঘরগুলো নিরাপদ — সেখানে গুটি কাটা যায় না।',
      'পাকা ঘরে প্রবেশ করতে একদম সঠিক সংখ্যা তুলতে হবে। সবার আগে ৪টি গুটি ঘরে তুললে বিজয়ী!',
    ],
  },
};
