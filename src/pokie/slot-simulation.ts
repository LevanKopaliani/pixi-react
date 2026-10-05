import {
  Simulation,
  SimulationConfig,
  SymbolsCombination,
  SymbolsCombinationsAnalyzer,
  VideoSlotSession,
  VideoSlotWinCalculator,
} from "pokie";
import { SlotConfig } from "./slot-config";

const config = new SlotConfig();

export function runSimulation() {
  const session = new VideoSlotSession(config);
  config.setCreditsAmount(Infinity);
  const simulationConfig = new SimulationConfig();
  simulationConfig.setNumberOfRounds(100_000_000);
  const simulation = new Simulation(session, simulationConfig);
  simulation.run();

  console.log("Simulation results:");
  console.table([
    {
      RTP: simulation.getAverageRtp(),
      "Average Payout": simulation.getAveragePayout(),
      "Payout Std Dev": simulation.getPayoutsStandardDeviation(),
      "Average Payout (Wins Only)": simulation.getAveragePayout(false),
      "Payout Std Dev (Wins Only)":
        simulation.getPayoutsStandardDeviation(false),
    },
  ]);

  console.log("Simulation completed");
  return simulation;
}

/* --- Test Combination --- */
// NOTE: With 5 reels of 29-35 symbols, getAllPossibleSymbolsCombinations generates
// 29 * 35 * 35 * 35 * 29 = 36,047,375 combinations, which freezes the browser tab in an infinite/out-of-memory loop.
export const allReelsCombinations: string[][][] = [];

export const checkPossiblePayout = () => {
  const combinations =
    allReelsCombinations.length > 0
      ? allReelsCombinations
      : SymbolsCombinationsAnalyzer.getAllPossibleSymbolsCombinations(
          config.getSymbolsSequences(),
          config.getReelsSymbolsNumber(),
        );

  const allWinsData: VideoSlotWinCalculator[] = [];
  let totalPayout = 0;
  combinations.forEach((combination) => {
    const wc = new VideoSlotWinCalculator(config);
    wc.calculateWin(
      config.getBet(),
      new SymbolsCombination().fromMatrix(combination),
    );
    if (wc.getWinAmount() > 0) {
      allWinsData.push(wc);
      totalPayout += wc.getWinAmount();
    }
  });

  console.log("Total winning combinations number: " + allWinsData.length);
  console.log("Total payout: " + totalPayout);
  console.log("Hit frequency: " + allWinsData.length / combinations.length);
  console.log("RTP: " + totalPayout / combinations.length);

  return {
    allWinsData,
    totalPayout,
  };
};
