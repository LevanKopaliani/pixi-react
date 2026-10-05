import {
  LeftToRightLinesPatterns,
  SymbolsSequence,
  VideoSlotWithFreeGamesConfig,
} from "pokie";

export function customSequences(config: VideoSlotWithFreeGamesConfig) {
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

  config.setSymbolsSequences(sequences);
}
