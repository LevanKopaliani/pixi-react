import { useEffect, useRef } from "react";
import { Application, extend } from "@pixi/react";
import "./App.css";
import { Container, Sprite, Graphics, Text } from "pixi.js";
import ReelsFrame from "@/components/ReelsFrame";
import Reels from "@/components/Reels";
import GameBackground from "@/components/GameBackground";
import { initializeData } from "./pokie/data";

import {
  customGameSession as session,
  customGameSessionSerializer as serializer,
} from "@/pokie";
import { customScenarios as scenarios } from "./pokie/custom-scenarios";

extend({ Sprite, Container, Graphics, Text });

function App() {
  const parentRef = useRef<HTMLDivElement>(null);

  const game = {
    // width: 1270,
    // height: 720,

    resizeOptions: { minWidth: 1270, minHeight: 720, letterbox: false },
    resizeTo: window,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  };

  useEffect(() => {
    initializeData(session, serializer, scenarios);
  }, []);

  return (
    <section className="w-full min-h-dvh flex items-center justify-center">
      <div ref={parentRef} className="">
        <Application {...game} autoStart sharedTicker>
          <GameBackground />
          <ReelsFrame>
            <Reels />
          </ReelsFrame>
        </Application>
      </div>
    </section>
  );
}

export default App;
