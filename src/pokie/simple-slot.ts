/*
This is an example of a simple 5x4 video slot game with 8 winning lines.

Features:
- Winning lines are counted from right to left. A line of minimum 3 winning symbols pays out.

- "Wild" is a wild symbol that substitutes any other symbol on a winning line.

- "Scatter1" is a scatter symbol that pays out 10x, 20x, or 30x the bet if 3 or more symbols
  appear on any positions. Only one "Scatter1" can appear on any reel.

- "Scatter2" is a stacked scatter symbol that can appear on the 3 middle reels.
  If all 3 middle reels are covered with "Scatter2" symbols, the game pays 100x the bet.
*/

import { availableBets } from "@/config";
import {
  CustomLinesDefinitions,
  LeftToRightLinesPatterns,
  LinesDefinitionsFor5x3,
  Paytable,
  Simulation,
  SimulationConfig,
  SymbolsCombination,
  SymbolsCombinationsAnalyzer,
  SymbolsSequence,
  VideoSlotConfig,
  VideoSlotSession,
  VideoSlotSessionSerializer,
  VideoSlotWinCalculator,
} from "pokie";

/*
Let's create the game configuration.
We can define the bounds of the reels matrix, a list of available bets in the game,
and a list of all available symbols. We also need to define which symbols are wilds and scatters.
*/
const config = new VideoSlotConfig();
config.setReelsNumber(5);
// config.setReelsSymbolsNumber(4);
config.setReelsSymbolsNumber(3);
config.setAvailableBets(availableBets);
config.setAvailableSymbols([
  "ten",
  "jack",
  "grape",
  "khinkali",
  "sufra",
  "dance",
  "freespins1",
  "freespins2",
]);
config.setWildSymbols(["dance"]);
config.setScatterSymbols(["freespins1", "freespins2"]);

// export const symbolsMap = {
//     "Ten": "Symbol_Ten",
//     "Jack": "Jack",
//     "Queen": "Queen",
//     "King": "King",
//     "Ace": "Ace",
//     "Nine": "Nine",
//     "Wild": "Wild",
//     "Scatter1": "Scatter1",
//     "Scatter2": "Scatter2",
// };

/*
There are several default classes representing lines definitions.
Let's use the one for 5x4 reels as the base.
*/
const defaultLinesDefinitions = new LinesDefinitionsFor5x3();

/*
We want to use only first 8 lines from the default definitions.
Let's copy them to our own custom definitions object and put it into the game config.
*/
const customLinesDefinitions = new CustomLinesDefinitions();
customLinesDefinitions.setLineDefinition(
  "0",
  defaultLinesDefinitions.getLineDefinition("0"),
);
customLinesDefinitions.setLineDefinition(
  "1",
  defaultLinesDefinitions.getLineDefinition("1"),
);
customLinesDefinitions.setLineDefinition(
  "2",
  defaultLinesDefinitions.getLineDefinition("2"),
);
customLinesDefinitions.setLineDefinition(
  "3",
  defaultLinesDefinitions.getLineDefinition("3"),
);
customLinesDefinitions.setLineDefinition(
  "4",
  defaultLinesDefinitions.getLineDefinition("4"),
);
customLinesDefinitions.setLineDefinition(
  "5",
  defaultLinesDefinitions.getLineDefinition("5"),
);
customLinesDefinitions.setLineDefinition(
  "6",
  defaultLinesDefinitions.getLineDefinition("6"),
);
customLinesDefinitions.setLineDefinition(
  "7",
  defaultLinesDefinitions.getLineDefinition("7"),
);
config.setLinesDefinitions(customLinesDefinitions);

/*
Lines patterns define the direction of how the winning symbols are counted on the winning line.
In our case, lines should count from right to left, so let's instantiate the patterns we want
and put them into the config.
*/
// const linesPatterns = new RightToLeftLinesPatterns(config.getReelsNumber());
const linesPatterns = new LeftToRightLinesPatterns(config.getReelsNumber());
config.setLinesPatterns(linesPatterns);

/*
Symbols sequences (also known as reels strips) are the long lists with all possible symbols combinations in the game.
When the round outcome combination is generated, the symbols are retrieved from these sequences.

Let's create an empty array where we will put the sequences for every reel and iterate over the number of reels.
*/
const sequences = [];
for (let i = 0; i < config.getReelsNumber(); i++) {
  /*
    Create a single sequence for the current reel. The sequence is empty by default.
     */
  const sequence = new SymbolsSequence();

  /*
    There are several ways of initializing the sequence with symbols.
    Here we will initialize it by defining a map of the number of each symbol on the sequence.
    Let's say we want to have 5 symbols "Nines" and "Tens", 4 "Jacks" and "Queens", 3 "Kings", 2 "Aces", 5 "Wilds",
    and only 1 "Scatter1".
     */
  sequence.fromNumbersOfSymbols({
    ten: 5,
    jack: 5,
    grape: 4,
    khinkali: 4,
    sufra: 3,
    dance: 3,
    freespins1: 1,
    freespins2: 1,
  });

  /*
    The sequence we've just created will contain the stacks of the size of the number of every symbol we've provided.
    We need to shuffle it to have symbols distributed randomly on the sequence.
     */
  sequence.shuffle();

  /*
    Since we want to have only 1 "Scatter1" symbol on every reel during play, we need to continue shuffling
    the sequence until there are no situations where 2 or more "Scatter1" symbols appear together.
     */
  for (let j = 0; j < sequence.getSize(); j++) {
    const symbols = sequence.getSymbols(j, config.getReelsSymbolsNumber());
    const scatters = symbols.filter((symbol) => symbol === "freespins1");
    if (scatters.length > 1) {
      sequence.shuffle();
      j = 0;
    }
  }

  /*
    Once we have the properly built sequence, we save it for the current reel.
     */
  sequences.push(sequence);
}

/*
 * Now let's add the stacks of special "Scatter2" symbols.
 * Let's add one stack at the middle of the sequence for each reel.
 */
sequences[1].addSymbol(
  "freespins2",
  config.getReelsSymbolsNumber(),
  Math.floor(sequences[1].getSize() / 2),
);
sequences[2].addSymbol(
  "freespins2",
  config.getReelsSymbolsNumber(),
  Math.floor(sequences[2].getSize() / 2),
);
sequences[3].addSymbol(
  "freespins2",
  config.getReelsSymbolsNumber(),
  Math.floor(sequences[3].getSize() / 2),
);

/*
 * And one more stack at the very end of the sequence so that these stacks will not intersect.
 */
sequences[1].addSymbol("freespins2", config.getReelsSymbolsNumber());
sequences[2].addSymbol("freespins2", config.getReelsSymbolsNumber());
sequences[3].addSymbol("freespins2", config.getReelsSymbolsNumber());

/*
 * Once the sequences are built, we can put them into the config.
 */

console.log("sequences-------------", sequences);
config.setSymbolsSequences(sequences);

/*
 * Let's say that the initial balance for the game session should be 10000 credits.
 */
config.setCreditsAmount(10000);

/*
 * Finally, we need to define the paytable for the game.
 * Let's initialize an empty paytable for the list of available bets.
 */
const paytable = new Paytable(config.getAvailableBets());

/*
 * After that, we can specify the payouts for every particular symbol.
 */
paytable.setPayoutForSymbol("ten", 3, 1);
paytable.setPayoutForSymbol("ten", 4, 2);
paytable.setPayoutForSymbol("ten", 5, 3);
paytable.setPayoutForSymbol("Ten", 3, 1);
paytable.setPayoutForSymbol("Ten", 4, 2);
paytable.setPayoutForSymbol("Ten", 5, 3);

paytable.setPayoutForSymbol("jack", 3, 2);
paytable.setPayoutForSymbol("jack", 4, 4);
paytable.setPayoutForSymbol("jack", 5, 6);
paytable.setPayoutForSymbol("Jack", 3, 2);
paytable.setPayoutForSymbol("Jack", 4, 4);
paytable.setPayoutForSymbol("Jack", 5, 6);

paytable.setPayoutForSymbol("grape", 3, 2);
paytable.setPayoutForSymbol("grape", 4, 4);
paytable.setPayoutForSymbol("grape", 5, 6);

paytable.setPayoutForSymbol("khinkali", 3, 4);
paytable.setPayoutForSymbol("khinkali", 4, 6);
paytable.setPayoutForSymbol("khinkali", 5, 8);

paytable.setPayoutForSymbol("sufra", 3, 6);
paytable.setPayoutForSymbol("sufra", 4, 8);
paytable.setPayoutForSymbol("sufra", 5, 10);

paytable.setPayoutForSymbol("dance", 3, 10);
paytable.setPayoutForSymbol("dance", 4, 20);
paytable.setPayoutForSymbol("dance", 5, 50);

paytable.setPayoutForSymbol("freespins1", 3, 10);
paytable.setPayoutForSymbol("freespins1", 4, 20);
paytable.setPayoutForSymbol("freespins1", 5, 30);
paytable.setPayoutForSymbol("freespins2", 12, 100);

/*
 * Once the paytable is defined, we can put it into the config.
 */
config.setPaytable(paytable);

/*
 * Now everything is done, and the default video slot game session can be created for the config we've just built.
 */
const session = new VideoSlotSession(config);

export const customGameSession = session;
export const customGameSessionSerializer = new VideoSlotSessionSerializer();
export const customScenarios = [];

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
