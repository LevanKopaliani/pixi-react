/*
An example of a 5x3 video slot game with free spins.

Features:
- A minimum of 2 winning symbols on a winning line or scattered across all reels pays out.
- During free spins, symbols on a winning line are counted not only from left to right but can also be scattered across
  the winning line definition.
- During free spins, symbol sequences are different from the base game's ones. Sequences during free spins do not
  contain scatter symbols, so free spins cannot be re-triggered.
- During free spins, all wins are multiplied by x2.
- This example also demonstrates the usage of Simulation to obtain the desired game outcomes.
*/

import {
  SymbolsCombinationsGenerator,
  VideoSlotWithFreeGamesSessionSerializer,
} from "pokie";
import { SlotConfig } from "./slot-config.ts";
import { SlotSession } from "./slot-session.ts";
import { SlotSessionWinCalculator } from "./slot-win-calculator.ts";

/*
Let's create the game configuration.

In this example, we will use a custom config class that inherits from VideoSlotWithFreeGamesConfig to provide different
symbol sequences and line patterns during free spins.
*/
const config = new SlotConfig();

/*
The Combinations Generator is an object responsible for generating the reel symbols matrix for each game round. The
generateSymbolsCombination() method of this class is triggered every time the session is played. For this example, we
will use the default combinations generator.
*/
const combinationsGenerator = new SymbolsCombinationsGenerator(config);

/*
As the name suggests, the Win Calculator is responsible for calculating the outcome of each game round. The
calculateWin() method of this class is triggered every time the session is played, defining the winning lines and
winning scatters based on the symbols combination provided for this method. The information about winning lines,
scatters, and other round-winning data can be retrieved through dedicated methods.

For this example, we will use an instance of our custom win calculator, which inherits from VideoSlotWinCalculator, to
ensure that the winnings during free spins are multiplied by x2.
*/
const winCalculator = new SlotSessionWinCalculator(config);

/*
In this example, we will use our custom session class, which overrides the play() method. This override allows us to
define whether we are in free spins mode or not and sets the appropriate flag in the game configuration.
 */
const session = new SlotSession(config, combinationsGenerator, winCalculator);

/*
Now it's time for simulations. The simulation class uses strategies to determine if the simulation should be stopped
after a certain game round. Before every simulation round, the canPlayNextSimulationRound() method of the strategy
provided to the simulation's config gets triggered. If this method returns false, then the simulation stops, and we can
assume that the criteria of the game round we are waiting for are met.
 */

// export session
export const customGameSession = session;
export const customGameSessionSerializer =
  new VideoSlotWithFreeGamesSessionSerializer();
