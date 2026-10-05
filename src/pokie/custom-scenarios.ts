import {
  PlayFreeGamesStrategy,
  SimulationConfig,
  VideoSlotSession,
  type VideoSlotWithFreeGamesRoundNetworkData,
} from "pokie";
import { getCustomScenarioData } from "./data";

/*
Let's create the config for a simulation that should stop if the free spins are triggered. We'll set the number of
simulation rounds to Infinity so that the simulation can be played until the strategy determines the round with free
spins. The default class PlayFreeGamesStrategy can be used for that.
 */

const fgConfig = new SimulationConfig();
fgConfig.setNumberOfRounds(Infinity);
fgConfig.setPlayStrategy(new PlayFreeGamesStrategy());

/*
Another simulation config will be used to stop the simulation on the last free spins round if any amount of free bank
was collected during free spins.
 */
const lastFgConfig = new SimulationConfig();
lastFgConfig.setNumberOfRounds(Infinity);
const lastFgStrategy = new PlayFreeGamesStrategy();
lastFgStrategy.setLastFreeGame(true);
lastFgStrategy.setShouldHaveFreeBankAtEnd(true);
lastFgConfig.setPlayStrategy(lastFgStrategy);

/*
One more similar simulation config, but this time for the last free spins round without any free bank.
 */
const lastFgNoBankConfig = new SimulationConfig();
lastFgNoBankConfig.setNumberOfRounds(Infinity);
const lastFgNoBankStrategy = new PlayFreeGamesStrategy();
lastFgNoBankStrategy.setLastFreeGame(true);
lastFgNoBankStrategy.setShouldHaveFreeBankAtEnd(false);
lastFgNoBankConfig.setPlayStrategy(lastFgNoBankStrategy);

/*
And one more config with our custom strategy that determines if the current round has both winning lines and scatters.
 */
const linesAndScattersConfig = new SimulationConfig();
linesAndScattersConfig.setNumberOfRounds(Infinity);
linesAndScattersConfig.setPlayStrategy({
  canPlayNextSimulationRound: (session: VideoSlotSession) =>
    !(
      Object.keys(session.getWinningLines()).length > 0 &&
      Object.keys(session.getWinningScatters()).length > 0
    ),
});

export const getCustomScenario = async (scenarioId: string) => {
  const data = (await getCustomScenarioData(
    scenarioId,
  )) as VideoSlotWithFreeGamesRoundNetworkData;
  if (data) {
    return data;
  }
};

export const customScenarios = [
  ["fg", "Free games", fgConfig],
  ["fgBank", "Last free game with free bank", lastFgConfig],
  ["fgNoBank", "Last free game without free bank", lastFgNoBankConfig],
  ["scLines", "Lines and scatters", linesAndScattersConfig],
] as [string, string, SimulationConfig][];
