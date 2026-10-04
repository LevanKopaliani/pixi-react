import {
  Assets,
  type Texture,
  type Container as PixiContainer,
  type Graphics as PixiGraphics,
} from "pixi.js";
import { useEffect, useState, useRef } from "react";
import frame from "@/assets/game/frame.png";
import GameControls from "./GameControls";
import WinningLinesOverlay from "./WinningLinesOverlay";

export const FRAME_CONFIG = {
  WIDTH: 1270,
  HEIGHT: 720,
  // Inner transparent window dimensions and offset relative to frame center (0, 0)
  INNER_WIDTH: 800,
  INNER_HEIGHT: 437,
  INNER_OFFSET_X: 0,
  INNER_OFFSET_Y: -6,
};

const ReelsFrame = (props: React.PropsWithChildren) => {
  const [texture, setTexture] = useState<Texture | null>(null);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1270,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  });

  const reelsContainerRef = useRef<PixiContainer | null>(null);
  const maskRef = useRef<PixiGraphics | null>(null);

  useEffect(() => {
    if (reelsContainerRef.current && maskRef.current) {
      reelsContainerRef.current.mask = maskRef.current;
    }
  }, [texture]);

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    Assets.load(frame)
      .then((loadedTexture) => {
        if (isMounted) {
          setTexture(loadedTexture);
        }
      })
      .catch((error) => {
        console.error("Failed to load frame texture:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!texture) {
    return null;
  }

  const centerX = screenSize.width / 2;
  const centerY = screenSize.height / 2 - screenSize.height / 15;
  const scale = Math.min(
    1,
    (screenSize.width * 0.96) / FRAME_CONFIG.WIDTH,
    (screenSize.height * 0.88) / FRAME_CONFIG.HEIGHT,
  );

  const maskX = -FRAME_CONFIG.INNER_WIDTH / 2;
  const maskY = FRAME_CONFIG.INNER_OFFSET_Y - FRAME_CONFIG.INNER_HEIGHT / 2;

  return (
    <pixiContainer x={centerX} y={centerY} scale={scale}>
      {/* Masked container for reels: clips rotating symbols within the inner frame window */}
      <pixiContainer
        ref={(el) => {
          const c = el as PixiContainer;
          reelsContainerRef.current = c;
          if (c && maskRef.current) {
            c.mask = maskRef.current;
          }
        }}
      >
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(
              maskX,
              maskY,
              FRAME_CONFIG.INNER_WIDTH,
              FRAME_CONFIG.INNER_HEIGHT,
            ).fill(0xffffff);
          }}
          ref={(el) => {
            const g = el as PixiGraphics;
            maskRef.current = g;
            if (g && reelsContainerRef.current) {
              reelsContainerRef.current.mask = g;
            }
          }}
        />
        {props.children}
        <WinningLinesOverlay />
      </pixiContainer>

      <pixiSprite
        texture={texture}
        x={0}
        y={0}
        anchor={0.5}
        width={FRAME_CONFIG.WIDTH}
        height={FRAME_CONFIG.HEIGHT}
      />
      <GameControls />
    </pixiContainer>
  );
};

export default ReelsFrame;
