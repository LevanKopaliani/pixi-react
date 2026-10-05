import { SlotConfig } from "./slot-config.ts";
import { VideoSlotWinCalculator } from "pokie";
import { FREE_GAMES_CONFIG } from "@/config";

/*
 * pokie credits the session using `getWinEvaluationResult().getTotalWin()`, so multiplying only the
 * winning lines/scatters returned by the getters is not enough - the payout itself would stay x1.
 *
 * Instead, we plug a multiplier resolver into pokie's win evaluation pipeline. Every win component
 * (lines and scatters) goes through `resolve()`, so the total win, the credited amount, the free
 * games bank and the serialized round data all stay consistent.
 *
 * `MultiplierResolver` is not exported from the pokie root, so we provide a structurally compatible
 * object and cast it to the expected option type.
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
    super(config, undefined, undefined, undefined, undefined, undefined, {
      multiplierResolver: createFreeGamesMultiplierResolver(config),
    });
  }
}
