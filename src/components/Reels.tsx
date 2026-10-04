import {
  Assets,
  type Texture,
  type Sprite as PixiSprite,
  type Container as PixiContainer,
} from "pixi.js";
import { useRef, useMemo, useState, useEffect, forwardRef } from "react";
import gsap from "gsap";

import {
  customGameSession,
  customGameSessionSerializer,
} from "@/pokie/simple-slot";

import dance from "@/assets/game/dance.png";
import freespins from "@/assets/game/freespins.png";
import grape from "@/assets/game/grape.png";
import khinkali from "@/assets/game/khinkali.png";
import jack from "@/assets/game/jack.png";
import sufra from "@/assets/game/sufra.png";
import ten from "@/assets/game/ten.png";
import { reelSymbols } from "@/config";
import { registerSpinAnimation, useSlotGame } from "@/pokie/slot-controller";

export const symbolAssetMap: Record<string, string> = {
  ten,
  jack,
  grape,
  khinkali,
  sufra,
  dance,
  // Aliases for pokie compatibility
  wild: dance,
  freespins1: freespins,
  freespins2: freespins,
};

// Global cache for symbol textures so they are loaded once across all reels
const symbolTextureCache = new Map<string, Texture>();
let loadingPromise: Promise<Map<string, Texture>> | null = null;

export async function loadSymbolTextures(): Promise<Map<string, Texture>> {
  if (symbolTextureCache.size > 0) {
    return symbolTextureCache;
  }
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const entries = Object.entries(symbolAssetMap);
      await Promise.all(
        entries.map(async ([name, src]) => {
          try {
            const tex = await Assets.load<Texture>(src);
            symbolTextureCache.set(name.toLowerCase(), tex);
          } catch (e) {
            console.error(`Failed to load symbol texture "${name}":`, e);
          }
        }),
      );
      return symbolTextureCache;
    })();
  }
  return loadingPromise;
}

export function getSymbolTexture(symbolKey: string): Texture | undefined {
  const key = symbolKey?.toLowerCase();
  return symbolTextureCache.get(key);
}

export const initialData =
  customGameSessionSerializer.getInitialData(customGameSession);

// 5 distinct default symbol strips for the 5 reels, initialized from pokie game session
export const DEFAULT_REEL_STRIPS: string[][] = initialData?.reelsSymbols
  ? initialData.reelsSymbols.map((strip: string[]) =>
      strip.map((s) => s.toLowerCase()),
    )
  : [];

export const REEL_CONFIG = {
  NUM_REELS: 5,
  NUM_ROWS: 3,
  BUFFER_ROWS: 0,
  SYMBOL_WIDTH: 140,
  SYMBOL_HEIGHT: 140,
  REEL_GAP: 20,
  ROW_GAP: 8,
  // Coordinates precisely centered inside the frame inner window
  START_X: -390,
  START_Y: -224,
};

export interface ReelColumnProps {
  x: number;
  y: number;
  columnData?: string[];
}

export const ReelColumn = forwardRef<PixiContainer, ReelColumnProps>(
  function ReelColumn({ x, y, columnData = reelSymbols }, ref) {
    const TOTAL_SLOTS = REEL_CONFIG.NUM_ROWS + REEL_CONFIG.BUFFER_ROWS;

    const pool = useMemo(() => {
      return columnData && columnData.length > 0 ? columnData : reelSymbols;
    }, [columnData]);

    const step = REEL_CONFIG.SYMBOL_HEIGHT + REEL_CONFIG.ROW_GAP;

    return (
      <pixiContainer ref={ref} x={x} y={y}>
        {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
          const symbolKey = pool[i % pool.length];
          const texture = getSymbolTexture(symbolKey);

          return (
            <pixiSprite
              key={i}
              texture={texture}
              x={0}
              y={i * step}
              width={REEL_CONFIG.SYMBOL_WIDTH}
              height={REEL_CONFIG.SYMBOL_HEIGHT}
            />
          );
        })}
      </pixiContainer>
    );
  },
);

export interface ReelsProps {
  reels?: string[][];
  speed?: number;
}

export default function Reels({ reels: propReels }: ReelsProps) {
  const slot = useSlotGame();
  const reels =
    propReels ?? (slot.reels.length > 0 ? slot.reels : DEFAULT_REEL_STRIPS);

  const containerRef = useRef<PixiContainer | null>(null);
  const reelRefs = useRef<(PixiContainer | null)[]>([]);

  const [texturesLoaded, setTexturesLoaded] = useState(
    symbolTextureCache.size > 0,
  );

  useEffect(() => {
    let isMounted = true;
    if (symbolTextureCache.size === 0) {
      loadSymbolTextures().then(() => {
        if (isMounted) setTexturesLoaded(true);
      });
    } else {
      setTexturesLoaded(true);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP reel spinning animation inspired by pixi-slot
  const spinReelsWithGsap = (outcomeSymbols: string[][]) => {
    return new Promise<void>((resolve) => {
      const spinSpeed = 35;
      const stopDelay = 0.22; // Stagger delay between reels stopping
      let finishedReelsCount = 0;
      const gsapTweens: gsap.core.Tween[] = [];

      const step = REEL_CONFIG.SYMBOL_HEIGHT + REEL_CONFIG.ROW_GAP;
      const TOTAL_SLOTS = REEL_CONFIG.NUM_ROWS + REEL_CONFIG.BUFFER_ROWS;
      const totalHeight = TOTAL_SLOTS * step;

      const originalPositions = Array.from(
        { length: TOTAL_SLOTS },
        (_, i) => i * step,
      );

      const spinReel = (reel: PixiContainer, reelIndex: number) => {
        const sprites = reel.children as PixiSprite[];
        if (!sprites || sprites.length === 0) {
          finishedReelsCount++;
          if (finishedReelsCount === REEL_CONFIG.NUM_REELS) resolve();
          return;
        }

        // Continuous spinning tween
        const tween = gsap.to(reel, {
          duration: 1,
          ease: "none",
          repeat: -1,
          onUpdate: () => {
            sprites.forEach((symbol) => {
              symbol.y += spinSpeed;

              if (symbol.y >= totalHeight) {
                symbol.y -= totalHeight;
                // Swap texture to random symbol during roll
                const randSymbol =
                  reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
                const tex = getSymbolTexture(randSymbol);
                if (tex) symbol.texture = tex;
              }
            });
          },
        });

        gsapTweens.push(tween);

        // Staggered stop: 0.9s base + reelIndex * stopDelay
        gsap.delayedCall(0.9 + reelIndex * stopDelay, () => {
          tween.kill();

          // Set outcome textures for the visible 3 rows
          const targetStrip = outcomeSymbols[reelIndex];
          if (targetStrip) {
            targetStrip.forEach((symKey, rowIdx) => {
              const sprite = sprites[rowIdx];
              if (sprite) {
                const tex = getSymbolTexture(symKey);
                if (tex) sprite.texture = tex;
              }
            });
          }

          // Animate symbols back to exact resting positions with a satisfying landing bounce
          sprites.forEach((symbol, symbolIndex) => {
            gsap.to(symbol, {
              y: originalPositions[symbolIndex],
              duration: 0.35,
              ease: "back.out(1.3)",
              onComplete: () => {
                if (symbolIndex === 0) {
                  finishedReelsCount++;
                  if (finishedReelsCount === REEL_CONFIG.NUM_REELS) {
                    resolve();
                  }
                }
              },
            });
          });
        });
      };

      // Launch reels with a slight start stagger
      reelRefs.current.forEach((reel, reelIndex) => {
        if (reel) {
          gsap.delayedCall(reelIndex * 0.05, () => {
            spinReel(reel, reelIndex);
          });
        }
      });
    });
  };

  useEffect(() => {
    return registerSpinAnimation(spinReelsWithGsap);
  }, [texturesLoaded]);

  if (!texturesLoaded) {
    return null;
  }

  const pitch = REEL_CONFIG.SYMBOL_WIDTH + REEL_CONFIG.REEL_GAP;

  return (
    <pixiContainer
      ref={(el) => {
        containerRef.current = el as PixiContainer;
      }}
    >
      {reels.slice(0, REEL_CONFIG.NUM_REELS).map((strip, colIdx) => (
        <ReelColumn
          key={colIdx}
          ref={(el) => {
            reelRefs.current[colIdx] = el;
          }}
          x={REEL_CONFIG.START_X + colIdx * pitch}
          y={REEL_CONFIG.START_Y}
          columnData={strip}
        />
      ))}
    </pixiContainer>
  );
}
