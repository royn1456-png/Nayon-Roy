export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type SeatType = 'human' | 'bot' | 'off';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type TurnPhase =
  | 'WAIT_ROLL'
  | 'ROLLING'
  | 'SELECT_TOKEN'
  | 'ANIMATING_MOVE'
  | 'TURN_TRANSITION';

export type Language = 'en' | 'bn';

export interface PlayerConfig {
  color: PlayerColor;
  name: string;
  seat: SeatType;
}

export interface Token {
  id: string;
  color: PlayerColor;
  index: number; // 0..3
  /**
   * -1 = in home yard
   * 0..50 = outer ring steps walked from own start square
   * 51..55 = own colored home stretch (5 squares)
   * 56 = finished inside center goal
   */
  progress: number;
}

export interface MoveOption {
  tokenId: string;
  fromProgress: number;
  toProgress: number;
  captures: string[]; // opponent token ids that would be captured
  reachesGoal: boolean;
  exitsYard: boolean;
}

export interface PlayerStats {
  captures: number;
  sixesRolled: number;
  finishedOrder: number | null; // 1 for 1st place, etc.
}

export interface CaptureEffect {
  id: number;
  row: number;
  col: number;
  color: PlayerColor;
}
