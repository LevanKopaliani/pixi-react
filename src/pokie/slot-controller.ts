import { useState, useEffect } from "react";
import {
  customGameSession,
  customGameSessionSerializer,
} from "@/pokie/simple-slot";
import { availableBets } from "@/config";

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

const initialData =
  customGameSessionSerializer.getInitialData(customGameSession);

const state: SlotState = {
  balance: customGameSession.getCreditsAmount(),
  bet: customGameSession.getBet(),
  win: customGameSession.getWinAmount(),
  isSpinning: false,
  reels: initialData?.reelsSymbols
    ? initialData.reelsSymbols.map((strip: string[]) =>
        strip.map((s) => s.toLowerCase()),
      )
    : [],
  winningLines: [],
  speed: 0,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getSlotState(): SlotState {
  return state;
}

export function setBet(newBet: number) {
  if (state.isSpinning) return;
  customGameSession.setBet(newBet);
  state.bet = customGameSession.getBet();
  notify();
}

export function prevBet() {
  if (state.isSpinning) return;
  const current = customGameSession.getBet();
  const idx = availableBets.indexOf(current);
  if (idx > 0) {
    setBet(availableBets[idx - 1]);
  }
}

export function nextBet() {
  if (state.isSpinning) return;
  const current = customGameSession.getBet();
  const idx = availableBets.indexOf(current);
  if (idx >= 0 && idx < availableBets.length - 1) {
    setBet(availableBets[idx + 1]);
  }
}

export type SpinAnimationHandler = (outcome: string[][]) => Promise<void>;
let spinAnimationHandler: SpinAnimationHandler | null = null;

export function registerSpinAnimation(handler: SpinAnimationHandler) {
  spinAnimationHandler = handler;
  return () => {
    if (spinAnimationHandler === handler) {
      spinAnimationHandler = null;
    }
  };
}

export async function spin(): Promise<boolean> {
  if (state.isSpinning) return false;
  if (!customGameSession.canPlayNextGame()) {
    console.warn("Insufficient credits to play next game");
    return false;
  }

  // Deduct bet and start spinning
  state.isSpinning = true;
  state.win = 0;
  state.winningLines = [];
  state.balance = customGameSession.getCreditsAmount() - state.bet;
  notify();

  // Play round with pokie game session
  customGameSession.play();
  const roundData =
    customGameSessionSerializer.getRoundData(customGameSession);

  // Extract winning lines from session
  const winningLines: WinningLineInfo[] = [];
  const rawLines = customGameSession.getWinningLines();
  if (rawLines && Object.keys(rawLines).length > 0) {
    Object.values(rawLines).forEach((line) => {
      winningLines.push({
        lineId: String(line.getLineId()),
        definition: line.getDefinition(),
        symbolId: String(line.getSymbolId()),
        symbolsPositions: line.getSymbolsPositions(),
        winAmount: line.getWinAmount(),
      });
    });
  }

  const outcome = roundData.reelsSymbols
    ? roundData.reelsSymbols.map((strip: string[]) =>
        strip.map((s) => s.toLowerCase()),
      )
    : [];

  if (spinAnimationHandler) {
    await spinAnimationHandler(outcome);
  } else {
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  state.isSpinning = false;
  state.balance = roundData.credits ?? state.balance;
  state.win = roundData.totalWin ?? 0;
  state.winningLines = winningLines;
  if (outcome.length > 0) {
    state.reels = outcome;
  }
  notify();

  return true;
}

export function triggerTestWin(lineId: string = "0") {
  const defaultDefs: Record<string, number[]> = {
    "0": [1, 1, 1, 1, 1],
    "1": [0, 0, 0, 0, 0],
    "2": [2, 2, 2, 2, 2],
    "3": [0, 1, 2, 1, 0],
    "4": [2, 1, 0, 1, 2],
    "5": [1, 0, 0, 0, 1],
    "6": [1, 2, 2, 2, 1],
    "7": [0, 0, 1, 2, 2],
  };
  const def = defaultDefs[lineId] || [1, 1, 1, 1, 1];
  state.win = 40;
  state.winningLines = [
    {
      lineId,
      definition: def,
      symbolId: "khinkali",
      symbolsPositions: [0, 1, 2],
      winAmount: 40,
    },
  ];
  notify();
}

if (typeof window !== "undefined") {
  (window as any).triggerTestWin = triggerTestWin;
}

export function useSlotGame() {
  const [snapshot, setSnapshot] = useState<SlotState>({ ...state });

  useEffect(() => {
    const onUpdate = () => {
      setSnapshot({ ...state });
    };
    listeners.add(onUpdate);
    return () => {
      listeners.delete(onUpdate);
    };
  }, []);

  return {
    ...snapshot,
    spin,
    setBet,
    prevBet,
    nextBet,
    availableBets,
    gameSession: customGameSession,
    gameSessionSerializer: customGameSessionSerializer,
  };
}
