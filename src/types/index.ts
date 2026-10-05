export interface ReelColumnProps {
  x: number;
  y: number;
  columnData?: string[];
}
export interface ReelsProps {
  reels?: string[][];
  speed?: number;
}
export interface GameControlsProps {
  onSpin?: () => void;
  isSpinning?: boolean;
  balance?: number;
  bet?: number;
  win?: number;
  onBetChange?: (bet: number) => void;
}

export interface WinningLineInfo {
  lineId: string;
  definition: number[];
  symbolId: string;
  symbolsPositions: number[];
  winAmount: number;
}

export interface WinningScatterInfo {
  symbolId: string;
  /** [reelIndex, rowIndex] pairs */
  symbolsPositions: number[][];
  winAmount: number;
}

export interface FreeGamesState {
  /** True from the moment free spins are triggered until the outro popup is closed */
  active: boolean;
  /** Number of free spins already played */
  played: number;
  /** Total number of free spins awarded */
  total: number;
  /** Total amount won during the current free spins feature */
  bank: number;
  multiplier: number;
}

export type FeatureMessage =
  | { type: "intro"; freeSpins: number }
  | { type: "outro"; totalWin: number; freeSpins: number };

export interface SlotState {
  balance: number;
  bet: number;
  win: number;
  isSpinning: boolean;
  reels: string[][];
  winningLines: WinningLineInfo[];
  winningScatters: WinningScatterInfo[];
  freeGames: FreeGamesState;
  featureMessage: FeatureMessage | null;
  speed: number;
}
