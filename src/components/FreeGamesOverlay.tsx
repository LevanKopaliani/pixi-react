import { useEffect, useRef, useState } from "react";
import {
  type Container as PixiContainer,
  type Graphics as PixiGraphics,
} from "pixi.js";
import gsap from "gsap";

import { FRAME_CONFIG, FREE_GAMES_CONFIG } from "@/config";
import { useSlotGame } from "@/pokie/slot-controller";

const FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const GOLD = 0xffd54a;
const GOLD_LIGHT = 0xfff1b8;
const DEEP_BROWN = 0x3d1702;
const PANEL = 0x2a0d05;

const PANEL_W = 600;
const PANEL_H = 380;

/** Sunburst rays drawn behind the popup panel */
function drawRays(g: PixiGraphics) {
  g.clear();
  const rays = 18;
  const radius = 520;
  for (let i = 0; i < rays; i++) {
    const a1 = (i / rays) * Math.PI * 2;
    const a2 = a1 + Math.PI / rays;
    g.poly([
      0,
      0,
      Math.cos(a1) * radius,
      Math.sin(a1) * radius,
      Math.cos(a2) * radius,
      Math.sin(a2) * radius,
    ]).fill({ color: GOLD, alpha: 0.09 });
  }
}

function drawDim(g: PixiGraphics) {
  g.clear();
  g.rect(
    -FRAME_CONFIG.WIDTH / 2,
    -FRAME_CONFIG.HEIGHT / 2,
    FRAME_CONFIG.WIDTH,
    FRAME_CONFIG.HEIGHT,
  ).fill({ color: 0x000000, alpha: 0.6 });
}

function drawPanel(g: PixiGraphics) {
  g.clear();
  const x = -PANEL_W / 2;
  const y = -PANEL_H / 2;
  // Outer glow
  g.roundRect(x - 10, y - 10, PANEL_W + 20, PANEL_H + 20, 38).fill({
    color: GOLD,
    alpha: 0.18,
  });
  // Body
  g.roundRect(x, y, PANEL_W, PANEL_H, 30)
    .fill({ color: PANEL, alpha: 0.97 })
    .stroke({ width: 6, color: GOLD });
  // Top highlight band
  g.roundRect(x + 14, y + 14, PANEL_W - 28, PANEL_H / 2 - 14, 22).fill({
    color: 0xffffff,
    alpha: 0.04,
  });
  // Inner border
  g.roundRect(x + 14, y + 14, PANEL_W - 28, PANEL_H - 28, 22).stroke({
    width: 2,
    color: GOLD_LIGHT,
    alpha: 0.55,
  });
}

/**
 * Free spins presentation layer:
 *  - HUD pill with remaining spins, multiplier and accumulated win while free spins are running
 *  - Intro popup when free spins are triggered (with manual START button)
 *  - Outro popup with an animated total-win counter and manual COLLECT button
 *
 * Coordinates are local to the ReelsFrame container (0,0 = frame centre).
 */
export default function FreeGamesOverlay() {
  const { freeGames, featureMessage, startFreeSpins, closeOutro } =
    useSlotGame();

  const popupRef = useRef<PixiContainer | null>(null);
  const raysRef = useRef<PixiGraphics | null>(null);
  const hudRef = useRef<PixiContainer | null>(null);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Popup entrance animation + outro win counter
  useEffect(() => {
    const popup = popupRef.current;
    if (!featureMessage || !popup) return;

    popup.alpha = 0;
    popup.scale.set(0.3);
    const tl = gsap.timeline();
    tl.to(popup, { alpha: 1, duration: 0.25, ease: "power1.out" }, 0);
    tl.to(popup.scale, { x: 1, y: 1, duration: 0.6, ease: "back.out(1.8)" }, 0);

    let counter: gsap.core.Tween | null = null;
    if (featureMessage.type === "outro") {
      const value = { v: 0 };
      setDisplayTotal(0);
      counter = gsap.to(value, {
        v: featureMessage.totalWin,
        duration: 1.6,
        delay: 0.35,
        ease: "power2.out",
        onUpdate: () => setDisplayTotal(value.v),
      });
    }

    return () => {
      tl.kill();
      counter?.kill();
    };
  }, [featureMessage]);

  // Slowly rotating sunburst behind the popup
  useEffect(() => {
    const rays = raysRef.current;
    if (!featureMessage || !rays) return;
    const tween = gsap.to(rays, {
      rotation: Math.PI * 2,
      duration: 14,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, [featureMessage]);

  // HUD pop-in when the feature starts
  const hudVisible = freeGames.active && featureMessage?.type !== "intro";
  useEffect(() => {
    const hud = hudRef.current;
    if (!hudVisible || !hud) return;
    hud.scale.set(0.6);
    hud.alpha = 0;
    const tl = gsap.timeline();
    tl.to(hud, { alpha: 1, duration: 0.3 }, 0);
    tl.to(hud.scale, { x: 1, y: 1, duration: 0.45, ease: "back.out(2)" }, 0);
    return () => {
      tl.kill();
    };
  }, [hudVisible]);

  // Small bump of the HUD every time a free spin is consumed
  useEffect(() => {
    const hud = hudRef.current;
    if (!hudVisible || !hud || freeGames.played === 0) return;
    const tween = gsap.fromTo(
      hud.scale,
      { x: 1.08, y: 1.08 },
      { x: 1, y: 1, duration: 0.35, ease: "power2.out" },
    );
    return () => {
      tween.kill();
    };
  }, [freeGames.played, hudVisible]);

  const hudWidth = 520;
  const hudHeight = 44;

  return (
    <pixiContainer>
      {/* ---------- HUD ---------- */}
      {hudVisible && (
        <pixiContainer
          ref={(el) => {
            hudRef.current = el as PixiContainer;
          }}
          x={0}
          y={FREE_GAMES_CONFIG.HUD_Y}
        >
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(-hudWidth / 2, -hudHeight / 2, hudWidth, hudHeight, 22)
                .fill({ color: PANEL, alpha: 0.92 })
                .stroke({ width: 3, color: GOLD });
              // Multiplier badge
              g.circle(hudWidth / 2 - 4, 0, 26)
                .fill({ color: 0xc0392b })
                .stroke({ width: 3, color: GOLD });
            }}
          />
          <pixiText
            text={`FREE SPINS  ${Math.min(freeGames.played, freeGames.total)} / ${freeGames.total}`}
            x={-hudWidth / 2 + 24}
            y={0}
            anchor={{ x: 0, y: 0.5 }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 18,
              fontWeight: "bold",
              fill: GOLD,
              letterSpacing: 1,
              stroke: { color: DEEP_BROWN, width: 3 },
            }}
          />
          <pixiText
            text={`WIN  ${freeGames.bank.toLocaleString()}`}
            x={hudWidth / 2 - 48}
            y={0}
            anchor={{ x: 1, y: 0.5 }}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 18,
              fontWeight: "bold",
              fill: 0xffffff,
              letterSpacing: 1,
              stroke: { color: DEEP_BROWN, width: 3 },
            }}
          />
          <pixiText
            text={`x${freeGames.multiplier}`}
            x={hudWidth / 2 - 4}
            y={0}
            anchor={0.5}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 20,
              fontWeight: "900",
              fill: 0xffffff,
              stroke: { color: DEEP_BROWN, width: 3 },
            }}
          />
        </pixiContainer>
      )}

      {/* ---------- Intro / Outro popup ---------- */}
      {featureMessage && (
        <pixiContainer>
          <pixiGraphics draw={drawDim} eventMode="static" />
          <pixiGraphics
            ref={(el) => {
              raysRef.current = el as PixiGraphics;
            }}
            draw={drawRays}
          />
          <pixiContainer
            ref={(el) => {
              popupRef.current = el as PixiContainer;
            }}
          >
            <pixiGraphics draw={drawPanel} />

            {featureMessage.type === "intro" ? (
              <>
                <pixiText
                  text="CONGRATULATIONS!"
                  y={-135}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 22,
                    fontWeight: "bold",
                    fill: GOLD_LIGHT,
                    letterSpacing: 3,
                  }}
                />
                <pixiText
                  text={String(featureMessage.freeSpins)}
                  y={-62}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 88,
                    fontWeight: "900",
                    fill: GOLD,
                    stroke: { color: DEEP_BROWN, width: 8 },
                    dropShadow: {
                      color: 0x000000,
                      alpha: 0.6,
                      blur: 6,
                      distance: 4,
                      angle: Math.PI / 2,
                    },
                  }}
                />
                <pixiText
                  text="FREE SPINS"
                  y={12}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 36,
                    fontWeight: "900",
                    fill: GOLD,
                    letterSpacing: 4,
                    stroke: { color: DEEP_BROWN, width: 6 },
                  }}
                />
                <pixiText
                  text={`ALL WINS x${FREE_GAMES_CONFIG.MULTIPLIER}`}
                  y={62}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 18,
                    fontWeight: "bold",
                    fill: 0xffffff,
                    letterSpacing: 2,
                  }}
                />

                {/* Interactive START Button */}
                <pixiContainer
                  x={0}
                  y={122}
                  eventMode="static"
                  cursor="pointer"
                  scale={
                    pressedButton === "start"
                      ? 0.95
                      : hoveredButton === "start"
                        ? 1.05
                        : 1
                  }
                  onPointerEnter={() => setHoveredButton("start")}
                  onPointerLeave={() => {
                    setHoveredButton(null);
                    setPressedButton(null);
                  }}
                  onPointerDown={() => setPressedButton("start")}
                  onPointerUp={(e) => {
                    e?.stopPropagation?.();
                    setPressedButton(null);
                    startFreeSpins?.();
                  }}
                >
                  <pixiGraphics
                    draw={(g) => {
                      g.clear();
                      const btnW = 200;
                      const btnH = 46;
                      const x = -btnW / 2;
                      const y = -btnH / 2;
                      const isHover = hoveredButton === "start";

                      // Outer button glow
                      g.roundRect(x - 5, y - 5, btnW + 10, btnH + 10, 28).fill({
                        color: GOLD,
                        alpha: isHover ? 0.45 : 0.22,
                      });

                      // Main pill body
                      g.roundRect(x, y, btnW, btnH, 23)
                        .fill({ color: isHover ? 0xffdf6d : GOLD, alpha: 1 })
                        .stroke({ width: 3, color: 0xffffff });

                      // Gloss highlight
                      g.roundRect(x + 4, y + 4, btnW - 8, btnH / 2 - 4, 16).fill({
                        color: 0xffffff,
                        alpha: 0.35,
                      });
                    }}
                  />
                  <pixiText
                    text="START"
                    x={0}
                    y={0}
                    anchor={0.5}
                    style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: 22,
                      fontWeight: "900",
                      fill: DEEP_BROWN,
                      letterSpacing: 2,
                    }}
                  />
                </pixiContainer>
              </>
            ) : (
              <>
                <pixiText
                  text="FREE SPINS COMPLETE"
                  y={-135}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 22,
                    fontWeight: "bold",
                    fill: GOLD_LIGHT,
                    letterSpacing: 3,
                  }}
                />
                <pixiText
                  text="YOU WON"
                  y={-85}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 28,
                    fontWeight: "900",
                    fill: GOLD,
                    letterSpacing: 4,
                    stroke: { color: DEEP_BROWN, width: 5 },
                  }}
                />
                <pixiText
                  text={Math.round(displayTotal).toLocaleString()}
                  y={-15}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 76,
                    fontWeight: "900",
                    fill: GOLD,
                    stroke: { color: DEEP_BROWN, width: 8 },
                    dropShadow: {
                      color: 0x000000,
                      alpha: 0.6,
                      blur: 6,
                      distance: 4,
                      angle: Math.PI / 2,
                    },
                  }}
                />
                <pixiText
                  text={`IN ${featureMessage.freeSpins} FREE SPINS`}
                  y={58}
                  anchor={0.5}
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 18,
                    fontWeight: "bold",
                    fill: 0xffffff,
                    letterSpacing: 2,
                  }}
                />

                {/* Interactive COLLECT Button */}
                <pixiContainer
                  x={0}
                  y={122}
                  eventMode="static"
                  cursor="pointer"
                  scale={
                    pressedButton === "collect"
                      ? 0.95
                      : hoveredButton === "collect"
                        ? 1.05
                        : 1
                  }
                  onPointerEnter={() => setHoveredButton("collect")}
                  onPointerLeave={() => {
                    setHoveredButton(null);
                    setPressedButton(null);
                  }}
                  onPointerDown={() => setPressedButton("collect")}
                  onPointerUp={(e) => {
                    e?.stopPropagation?.();
                    setPressedButton(null);
                    closeOutro?.();
                  }}
                >
                  <pixiGraphics
                    draw={(g) => {
                      g.clear();
                      const btnW = 200;
                      const btnH = 46;
                      const x = -btnW / 2;
                      const y = -btnH / 2;
                      const isHover = hoveredButton === "collect";

                      // Outer button glow
                      g.roundRect(x - 5, y - 5, btnW + 10, btnH + 10, 28).fill({
                        color: GOLD,
                        alpha: isHover ? 0.45 : 0.22,
                      });

                      // Main pill body
                      g.roundRect(x, y, btnW, btnH, 23)
                        .fill({ color: isHover ? 0xffdf6d : GOLD, alpha: 1 })
                        .stroke({ width: 3, color: 0xffffff });

                      // Gloss highlight
                      g.roundRect(x + 4, y + 4, btnW - 8, btnH / 2 - 4, 16).fill({
                        color: 0xffffff,
                        alpha: 0.35,
                      });
                    }}
                  />
                  <pixiText
                    text="COLLECT"
                    x={0}
                    y={0}
                    anchor={0.5}
                    style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: 22,
                      fontWeight: "900",
                      fill: DEEP_BROWN,
                      letterSpacing: 2,
                    }}
                  />
                </pixiContainer>
              </>
            )}
          </pixiContainer>
        </pixiContainer>
      )}
    </pixiContainer>
  );
}
