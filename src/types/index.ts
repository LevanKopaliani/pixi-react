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

export interface SlotState {
  balance: number;
  bet: number;
  win: number;
  isSpinning: boolean;
  reels: string[][];
  winningLines: WinningLineInfo[];
  speed: number;
}
