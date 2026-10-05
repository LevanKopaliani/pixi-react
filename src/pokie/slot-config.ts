import { availableBets } from "@/config";
import {
  type LinesPatternsDescribing,
  type SymbolsSequenceDescribing,
  LeftToRightLinesPatterns,
  LinesDefinitionsFor5x3,
  Paytable,
  ScatteredLinesPatterns,
  SymbolsSequence,
  VideoSlotWithFreeGamesConfig,
} from "pokie";

export class SlotConfig extends VideoSlotWithFreeGamesConfig {
  private readonly normalSequences: SymbolsSequence[];
  private readonly freeGamesSequences: SymbolsSequence[];
  private readonly normalPatterns: LeftToRightLinesPatterns;
  private readonly freeGamesPatterns: ScatteredLinesPatterns;
  private freeGamesMode = false;

  constructor() {
    super();
    this.setCreditsAmount(10000);
    this.setReelsNumber(5);
    this.setReelsSymbolsNumber(3);
    this.setAvailableBets(availableBets);
    this.setAvailableSymbols([
      "ten",
      "jack",
      "grape",
      "khinkali",
      "sufra",
      "dance",
      "freespins1",
      "freespins2",
    ]);
    this.setWildSymbols(["dance"]);
    this.setScatterSymbols(["freespins1", "freespins2"]);

    const pt = new Paytable(
      this.getAvailableBets(),
      this.getAvailableSymbols(),
      this.getWildSymbols(),
      this.getReelsNumber(),
    );

    /*
     * After that, we can specify the payouts for every particular symbol.
     */
    pt.setPayoutForSymbol("ten", 3, 1);
    pt.setPayoutForSymbol("ten", 4, 2);
    pt.setPayoutForSymbol("ten", 5, 3);

    pt.setPayoutForSymbol("jack", 3, 2);
    pt.setPayoutForSymbol("jack", 4, 4);
    pt.setPayoutForSymbol("jack", 5, 6);

    pt.setPayoutForSymbol("grape", 3, 2);
    pt.setPayoutForSymbol("grape", 4, 4);
    pt.setPayoutForSymbol("grape", 5, 6);

    pt.setPayoutForSymbol("khinkali", 3, 4);
    pt.setPayoutForSymbol("khinkali", 4, 6);
    pt.setPayoutForSymbol("khinkali", 5, 8);

    pt.setPayoutForSymbol("sufra", 3, 6);
    pt.setPayoutForSymbol("sufra", 4, 8);
    pt.setPayoutForSymbol("sufra", 5, 10);

    pt.setPayoutForSymbol("dance", 3, 10);
    pt.setPayoutForSymbol("dance", 4, 20);
    pt.setPayoutForSymbol("dance", 5, 50);

    pt.setPayoutForSymbol("freespins1", 3, 10);
    pt.setPayoutForSymbol("freespins1", 4, 20);
    pt.setPayoutForSymbol("freespins1", 5, 30);

    pt.setPayoutForSymbol("freespins2", 3, 10);
    pt.setPayoutForSymbol("freespins2", 4, 20);
    pt.setPayoutForSymbol("freespins2", 5, 30);

    // this.getAvailableSymbols()
    //   .filter((symbol) => !this.isSymbolWild(symbol))
    //   .forEach((symbol) => {
    //     pt.setPayoutForSymbol(symbol, 2, 1);
    //     pt.setPayoutForSymbol(symbol, 3, 2);
    //     pt.setPayoutForSymbol(symbol, 4, 3);
    //     pt.setPayoutForSymbol(symbol, 5, 4);
    //   });

    this.setPaytable(pt);

    this.normalPatterns = new LeftToRightLinesPatterns(
      this.getReelsNumber(),
      2,
    );

    this.freeGamesPatterns = new ScatteredLinesPatterns(
      this.getReelsNumber(),
      2,
    );

    this.setLinesDefinitions(new LinesDefinitionsFor5x3());
    //
    this.normalSequences = super
      .getSymbolsSequences()
      .map((sequence) => new SymbolsSequence().fromArray(sequence.toArray()));
    this.freeGamesSequences = super
      .getSymbolsSequences()
      .map((sequence) =>
        new SymbolsSequence()
          .fromArray(sequence.toArray())
          .removeAllSymbols(this.getScatterSymbols()[0]),
      );
    // sequence.fromNumbersOfSymbols({
    //   ten: 5,
    //   jack: 5,
    //   grape: 4,
    //   khinkali: 4,
    //   sufra: 3,
    //   dance: 3,
    //   freespins1: 1,
    //   freespins2: 1,
    // });

    // this.normalSequences.shuffle();
  }

  public setFreeGamesMode(value: boolean): void {
    this.freeGamesMode = value;
  }

  public isFreeGamesMode(): boolean {
    return this.freeGamesMode;
  }

  public getSymbolsSequences(): SymbolsSequenceDescribing[] {
    if (this.freeGamesMode) {
      return this.freeGamesSequences;
    } else {
      return this.normalSequences;
    }
  }

  public getLinesPatterns(): LinesPatternsDescribing {
    if (this.freeGamesMode) {
      return this.freeGamesPatterns;
    } else {
      return this.normalPatterns;
    }
  }
}
