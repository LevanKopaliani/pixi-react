import { SlotConfig } from "./slot-config.ts";
import {
  type ScatterWinCalculating,
  type SymbolsCombinationDescribing,
  type VideoSlotConfigDescribing,
  SymbolsCombinationsAnalyzer,
  VideoSlotWinCalculator,
  type WinningScatterDescribing,
  WinningScatter,
} from "pokie";
import { FREE_GAMES_CONFIG } from "@/config";

/**
 * Evaluates all scatter symbols (e.g. freespins1 and freespins2) as a unified group,
 * so landing any 3 or more scatter symbols across the reels triggers the scatter win and free spins.
 */
export class UnifiedScatterWinCalculator
  implements ScatterWinCalculating<string>
{
  private readonly config: VideoSlotConfigDescribing<string>;

  constructor(config: VideoSlotConfigDescribing<string>) {
    this.config = config;
  }

  public calculateWinningScatters(
    bet: number,
    symbolsCombination: SymbolsCombinationDescribing<string>,
  ): Record<string, WinningScatterDescribing<string>> {
    const matrix = symbolsCombination.toMatrix();
    const scatterSymbols = this.config.getScatterSymbols() ?? [];
    const allPositions: number[][] = [];

    for (const scatter of scatterSymbols) {
      const positions = SymbolsCombinationsAnalyzer.getScatterSymbolsPositions(
        matrix,
        scatter,
      );
      allPositions.push(...positions);
    }

    const count = allPositions.length;
    if (count >= 3) {
      const primaryId = scatterSymbols[0] || "freespins1";
      const winAmount = this.config
        .getPaytable()
        .getWinAmountForSymbol(primaryId, count, bet);
      return {
        [primaryId]: new WinningScatter(primaryId, allPositions, winAmount),
      };
    }
    return {};
  }
}

/*
 * pokie credits the session using `getWinEvaluationResult().getTotalWin()`, so multiplying only the
 * winning lines/scatters returned by the getters is not enough - the payout itself would stay x1.
 *
 * Instead, we plug a multiplier resolver into pokie's win evaluation pipeline. Every win component
 * (lines and scatters) goes through `resolve()`, so the total win, the credited amount, the free
 * games bank and the serialized round data all stay consistent.
 */
type WinCalculatorOptions = NonNullable<
  ConstructorParameters<typeof VideoSlotWinCalculator<string>>[6]
>;
type MultiplierResolverLike = NonNullable<
  WinCalculatorOptions["multiplierResolver"]
>;

interface WinComponentLike {
  getWinAmount(): number;
}

function createFreeGamesMultiplierResolver(
  config: SlotConfig,
): MultiplierResolverLike {
  const resolver = {
    getSupportedComponentTypes: () => undefined,
    supportsComponentType: () => true,
    resolve: (component: WinComponentLike) => {
      if (!config.isFreeGamesMode()) {
        return { winAmount: component.getWinAmount(), breakdown: [] };
      }
      return {
        winAmount: component.getWinAmount() * FREE_GAMES_CONFIG.MULTIPLIER,
        breakdown: [
          {
            source: "free-games-multiplier",
            positions: [],
            values: [FREE_GAMES_CONFIG.MULTIPLIER],
            combinedMultiplier: FREE_GAMES_CONFIG.MULTIPLIER,
          },
        ],
      };
    },
  };
  return resolver as unknown as MultiplierResolverLike;
}

export class SlotSessionWinCalculator extends VideoSlotWinCalculator {
  constructor(config: SlotConfig) {
    super(
      config,
      undefined,
      new UnifiedScatterWinCalculator(config),
      undefined,
      undefined,
      undefined,
      {
        multiplierResolver: createFreeGamesMultiplierResolver(config),
      },
    );
  }
}
