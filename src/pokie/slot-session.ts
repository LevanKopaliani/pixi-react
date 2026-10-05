import {
  type SymbolsCombinationsGenerating,
  type VideoSlotWinCalculating,
  VideoSlotWithFreeGamesSession,
} from "pokie";
import { SlotConfig } from "./slot-config.ts";

export class SlotSession extends VideoSlotWithFreeGamesSession {
  private static config: SlotConfig;

  constructor(
    config: SlotConfig,
    combinationsGenerator: SymbolsCombinationsGenerating,
    winCalculator: VideoSlotWinCalculating,
  ) {
    super(config, combinationsGenerator, winCalculator);
    SlotSession.config = config;
  }

  public play() {
    super.play();
    SlotSession.config.setFreeGamesMode(this.isNextRoundFreeGame());
  }

  /** True when free spins have been awarded and not all of them are played yet. */
  public isNextRoundFreeGame(): boolean {
    return (
      this.getFreeGamesSum() > 0 &&
      this.getFreeGamesNum() < this.getFreeGamesSum()
    );
  }

  /** Free spins must be playable even if the balance is below the bet. */
  public canPlayNextGame(): boolean {
    return this.isNextRoundFreeGame() || super.canPlayNextGame();
  }
}
