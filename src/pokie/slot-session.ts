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
    if (
      this.getFreeGamesSum() > 0 &&
      this.getFreeGamesNum() !== this.getFreeGamesSum()
    ) {
      SlotSession.config.setFreeGamesMode(true);
    } else {
      SlotSession.config.setFreeGamesMode(false);
    }
  }
}
