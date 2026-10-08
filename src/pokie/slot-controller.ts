import { useState, useEffect } from "react";

import { availableBets, FREE_GAMES_CONFIG } from "@/config";
import type {
  FreeGamesState,
  SlotState,
  WinningLineInfo,
  WinningScatterInfo,
} from "@/types";
import { customGameSession, customGameSessionSerializer } from ".";

const initialData =
  customGameSessionSerializer.getInitialData(customGameSession);

/** How long the triggering scatter win stays visible before the free spins intro pops up */
const TRIGGER_PRESENTATION_MS = 1400;

function readFreeGamesState(active: boolean): FreeGamesState {
  return {
    active,
    played: customGameSession.getFreeGamesNum(),
    total: customGameSession.getFreeGamesSum(),
    bank: customGameSession.getFreeGamesBank(),
    multiplier: FREE_GAMES_CONFIG.MULTIPLIER,
  };
}

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
  winningScatters: [],
  freeGames: readFreeGamesState(false),
  featureMessage: null,
  speed: 0,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

let outroTimer: ReturnType<typeof setTimeout> | null = null;

/** True while bet adjustment is locked (free spins feature or popup in progress). */
function isFeatureLocked() {
  return state.freeGames.active || state.featureMessage !== null;
}

export function getSlotState(): SlotState {
  return state;
}

export function setBet(newBet: number) {
  if (state.isSpinning || isFeatureLocked()) return;
  customGameSession.setBet(newBet);
  state.bet = customGameSession.getBet();
  notify();
}

export function prevBet() {
  if (state.isSpinning || isFeatureLocked()) return;
  const current = customGameSession.getBet();
  const idx = availableBets.indexOf(current);
  if (idx > 0) {
    setBet(availableBets[idx - 1]);
  }
}

export function nextBet() {
  if (state.isSpinning || isFeatureLocked()) return;
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

function extractWinningLines(): WinningLineInfo[] {
  const rawLines = customGameSession.getWinningLines();
  return Object.values(rawLines ?? {}).map((line) => ({
    lineId: String(line.getLineId()),
    definition: line.getDefinition(),
    symbolId: String(line.getSymbolId()),
    symbolsPositions: line.getSymbolsPositions(),
    winAmount: line.getWinAmount(),
  }));
}

function extractWinningScatters(): WinningScatterInfo[] {
  const rawScatters = customGameSession.getWinningScatters();
  return Object.values(rawScatters ?? {}).map((scatter) => ({
    symbolId: String(scatter.getSymbolId()),
    symbolsPositions: scatter.getSymbolsPositions(),
    winAmount: scatter.getWinAmount(),
  }));
}

/**
 * Plays a single round. Free spins are played manually by the player.
 * Once triggered, an intro popup is shown until the player manually starts the bonus mode.
 * Each free spin is initiated by the player clicking the Spin button.
 *
 * @param fromUser - true when the spin was requested by the player (spin button).
 */
export async function spin(fromUser = false): Promise<boolean> {
  void fromUser;
  if (state.isSpinning || state.featureMessage) return false;

  const isFreeRound = customGameSession.isNextRoundFreeGame();
  if (!customGameSession.canPlayNextGame()) {
    console.warn("Insufficient credits to play next game");
    return false;
  }

  // Start spinning. The bet is only deducted in base game rounds.
  state.isSpinning = true;
  state.win = 0;
  state.winningLines = [];
  state.winningScatters = [];
  if (!isFreeRound) {
    state.balance = customGameSession.getCreditsAmount() - state.bet;
  }
  notify();

  // Play round with pokie game session
  customGameSession.play();
  const roundData = customGameSessionSerializer.getRoundData(customGameSession);

  const winningLines = extractWinningLines();
  const winningScatters = extractWinningScatters();

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

  const wonFreeSpins = roundData.wonFreeGamesNumber ?? 0;
  const hasMoreFreeSpins = customGameSession.isNextRoundFreeGame();
  const featureJustEnded = isFreeRound && !hasMoreFreeSpins;

  state.balance = roundData.credits ?? state.balance;
  state.win = roundData.totalWin ?? 0;
  state.winningLines = winningLines;
  state.winningScatters = winningScatters;
  if (outcome.length > 0) {
    state.reels = outcome;
  }

  const delayAfterRound =
    state.win > 0
      ? FREE_GAMES_CONFIG.NEXT_SPIN_DELAY_AFTER_WIN_MS
      : FREE_GAMES_CONFIG.NEXT_SPIN_DELAY_MS;

  if (!isFreeRound && wonFreeSpins > 0) {
    // Keep isSpinning=true so player cannot click Spin during scatter presentation
    // Keep freeGames.active=false so HUD does not show until intro popup is accepted
    state.isSpinning = true;
    state.freeGames = readFreeGamesState(false);
    notify();

    // Show the winning scatters, then show the intro popup.
    await wait(TRIGGER_PRESENTATION_MS);
    state.isSpinning = false;
    state.featureMessage = { type: "intro", freeSpins: wonFreeSpins };
    notify();
  } else if (featureJustEnded) {
    state.isSpinning = true;
    state.freeGames = readFreeGamesState(true);
    notify();

    await wait(delayAfterRound);
    state.isSpinning = false;
    const { bank, total } = state.freeGames;
    state.featureMessage = { type: "outro", totalWin: bank, freeSpins: total };
    state.win = bank;
    state.winningLines = [];
    state.winningScatters = [];
    notify();

    // Fallback auto-close if player doesn't click COLLECT
    if (outroTimer) clearTimeout(outroTimer);
    outroTimer = setTimeout(() => {
      closeOutro();
    }, FREE_GAMES_CONFIG.OUTRO_DURATION_MS);
  } else {
    // Normal round (base game or ongoing free spin)
    state.isSpinning = false;
    state.freeGames = readFreeGamesState(isFreeRound);
    notify();
  }

  return true;
}

/** Dismisses the intro modal and enters the active free spins mode waiting for player spins. */
export function startFreeSpins() {
  if (state.featureMessage?.type !== "intro") return;
  state.featureMessage = null;
  state.win = 0;
  state.winningLines = [];
  state.winningScatters = [];
  state.freeGames = readFreeGamesState(true);
  notify();
}

/** Dismisses the outro modal and returns to the base game. */
export function closeOutro() {
  if (outroTimer) {
    clearTimeout(outroTimer);
    outroTimer = null;
  }
  if (state.featureMessage?.type !== "outro") return;
  state.featureMessage = null;
  state.freeGames = readFreeGamesState(false);
  notify();
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
    startFreeSpins,
    closeOutro,
    availableBets,
    gameSession: customGameSession,
    gameSessionSerializer: customGameSessionSerializer,
  };
}
