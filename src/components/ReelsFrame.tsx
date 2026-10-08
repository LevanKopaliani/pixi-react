import {
  Assets,
  type Texture,
  type Container as PixiContainer,
  type Graphics as PixiGraphics,
} from "pixi.js";
import { useEffect, useState, useRef } from "react";
import frame from "@/assets/game/frame.png";
import frameBackground from "@/assets/game/frame-background.png";
import GameControls from "./GameControls";
import WinningLinesOverlay from "./WinningLinesOverlay";
import FreeGamesOverlay from "./FreeGamesOverlay";
import { FRAME_CONFIG } from "@/config";

const ReelsFrame = (props: React.PropsWithChildren) => {
  const [texture, setTexture] = useState<Texture | null>(null);
  const [bgTexture, setBgTexture] = useState<Texture | null>(null);
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

    Promise.all([Assets.load(frame), Assets.load(frameBackground)])
      .then(([loadedFrame, loadedFrameBg]) => {
        if (isMounted) {
          setTexture(loadedFrame);
          setBgTexture(loadedFrameBg);
        }
      })
      .catch((error) => {
        console.error("Failed to load frame textures:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!texture || !bgTexture) {
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
      {/* Frame background (rendered behind reels and under the frame) */}
      <pixiSprite
        texture={bgTexture}
        x={0}
        y={FRAME_CONFIG.INNER_OFFSET_Y}
        anchor={0.5}
        width={FRAME_CONFIG.INNER_WIDTH + 20}
        height={FRAME_CONFIG.INNER_HEIGHT + 20}
      />

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
      <FreeGamesOverlay />
    </pixiContainer>
  );
};

export default ReelsFrame;
