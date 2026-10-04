import { useEffect, useState } from "react";
import { type Graphics as PixiGraphics } from "pixi.js";
import { useSlotGame, type WinningLineInfo } from "@/pokie/slot-controller";
import { REEL_CONFIG } from "./Reels";

export const LINE_COLORS: Record<
  string,
  { hex: number; hexStr: string; name: string }
> = {
  "0": { hex: 0xffd700, hexStr: "#FFD700", name: "Center Line" },
  "1": { hex: 0x00e5ff, hexStr: "#00E5FF", name: "Top Line" },
  "2": { hex: 0xff3366, hexStr: "#FF3366", name: "Bottom Line" },
  "3": { hex: 0x00ff66, hexStr: "#00FF66", name: "V Line" },
  "4": { hex: 0xff9900, hexStr: "#FF9900", name: "Inverted V" },
  "5": { hex: 0xa855f7, hexStr: "#A855F7", name: "M Arch" },
  "6": { hex: 0xff00cc, hexStr: "#FF00CC", name: "W Arch" },
  "7": { hex: 0x38bdf8, hexStr: "#38BDF8", name: "Staircase" },
};

export default function WinningLinesOverlay() {
  const { winningLines, isSpinning } = useSlotGame();
  const [activeLineIdx, setActiveLineIdx] = useState(0);

  // Reset active index when new winning lines arrive
  useEffect(() => {
    setActiveLineIdx(0);
  }, [winningLines]);

  // Cycle through multiple winning lines if more than 1
  useEffect(() => {
    if (isSpinning || winningLines.length <= 1) return;

    const interval = setInterval(() => {
      setActiveLineIdx((prev) => (prev + 1) % winningLines.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [winningLines.length, isSpinning]);

  if (isSpinning || !winningLines || winningLines.length === 0) {
    return null;
  }

  const activeLine: WinningLineInfo =
    winningLines[activeLineIdx] ?? winningLines[0];
  const colorInfo = LINE_COLORS[activeLine.lineId] || {
    hex: 0xffd700,
    hexStr: "#FFD700",
    name: `Line ${Number(activeLine.lineId) + 1}`,
  };

  // Coordinates helper
  const getCellCenter = (col: number, row: number) => {
    const pitchX = REEL_CONFIG.SYMBOL_WIDTH + REEL_CONFIG.REEL_GAP; // 160
    const pitchY = REEL_CONFIG.SYMBOL_HEIGHT + REEL_CONFIG.ROW_GAP; // 148
    return {
      x: REEL_CONFIG.START_X + col * pitchX + REEL_CONFIG.SYMBOL_WIDTH / 2, // -320 + col * 160
      y: REEL_CONFIG.START_Y + row * pitchY + REEL_CONFIG.SYMBOL_HEIGHT / 2, // -154 + row * 148
    };
  };

  const getCellBox = (col: number, row: number) => {
    const pitchX = REEL_CONFIG.SYMBOL_WIDTH + REEL_CONFIG.REEL_GAP;
    const pitchY = REEL_CONFIG.SYMBOL_HEIGHT + REEL_CONFIG.ROW_GAP;
    return {
      x: REEL_CONFIG.START_X + col * pitchX,
      y: REEL_CONFIG.START_Y + row * pitchY,
      w: REEL_CONFIG.SYMBOL_WIDTH,
      h: REEL_CONFIG.SYMBOL_HEIGHT,
    };
  };

  const drawLines = (g: PixiGraphics) => {
    g.clear();

    // 1. Draw inactive winning lines faintly in the background if multiple lines won
    winningLines.forEach((wl, idx) => {
      if (idx === activeLineIdx) return;
      const c = LINE_COLORS[wl.lineId]?.hex || 0xffffff;
      const points = wl.definition.map((row, col) => getCellCenter(col, row));

      if (points.length > 1) {
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          g.lineTo(points[i].x, points[i].y);
        }
        g.stroke({ width: 2, color: c, alpha: 0.25 });
      }
    });

    // 2. Draw full payline path faintly for active line
    const activePoints = activeLine.definition.map((row, col) =>
      getCellCenter(col, row),
    );
    if (activePoints.length > 1) {
      g.moveTo(activePoints[0].x, activePoints[0].y);
      for (let i = 1; i < activePoints.length; i++) {
        g.lineTo(activePoints[i].x, activePoints[i].y);
      }
      g.stroke({ width: 2.5, color: colorInfo.hex, alpha: 0.35 });
    }

    // 3. Draw winning line segment (the reels that actually matched)
    const participatingCols =
      activeLine.symbolsPositions && activeLine.symbolsPositions.length > 0
        ? activeLine.symbolsPositions
        : [0, 1, 2];

    const winPoints = participatingCols.map((col) =>
      getCellCenter(col, activeLine.definition[col]),
    );

    if (winPoints.length > 1) {
      // Outer glow
      g.moveTo(winPoints[0].x, winPoints[0].y);
      for (let i = 1; i < winPoints.length; i++) {
        g.lineTo(winPoints[i].x, winPoints[i].y);
      }
      g.stroke({
        width: 10,
        color: colorInfo.hex,
        alpha: 0.35,
        cap: "round",
        join: "round",
      });

      // Vibrant core line
      g.moveTo(winPoints[0].x, winPoints[0].y);
      for (let i = 1; i < winPoints.length; i++) {
        g.lineTo(winPoints[i].x, winPoints[i].y);
      }
      g.stroke({
        width: 5,
        color: colorInfo.hex,
        alpha: 0.95,
        cap: "round",
        join: "round",
      });

      // Bright inner laser highlight
      g.moveTo(winPoints[0].x, winPoints[0].y);
      for (let i = 1; i < winPoints.length; i++) {
        g.lineTo(winPoints[i].x, winPoints[i].y);
      }
      g.stroke({
        width: 2,
        color: 0xffffff,
        alpha: 0.9,
        cap: "round",
        join: "round",
      });
    }

    // 4. Draw glowing highlight boxes and center nodes for participating winning cells
    participatingCols.forEach((col) => {
      const row = activeLine.definition[col];
      const box = getCellBox(col, row);
      const center = getCellCenter(col, row);

      // Subtle translucent fill
      g.roundRect(box.x, box.y, box.w, box.h, 14).fill({
        color: colorInfo.hex,
        alpha: 0.12,
      });

      // Outer glow stroke
      g.roundRect(box.x - 2, box.y - 2, box.w + 4, box.h + 4, 16).stroke({
        width: 6,
        color: colorInfo.hex,
        alpha: 0.4,
      });

      // Crisp inner border
      g.roundRect(box.x, box.y, box.w, box.h, 14).stroke({
        width: 3,
        color: colorInfo.hex,
        alpha: 1.0,
      });

      // Center glowing node
      g.circle(center.x, center.y, 8).fill({
        color: colorInfo.hex,
        alpha: 0.8,
      });
      g.circle(center.x, center.y, 4).fill({
        color: 0xffffff,
        alpha: 1.0,
      });
    });

    // 5. Draw sleek winning banner pill at top of reels window
    const bannerW = 340;
    const bannerH = 34;
    const bannerX = -bannerW / 2;
    const bannerY = -215;

    g.roundRect(bannerX, bannerY, bannerW, bannerH, 17)
      .fill({ color: 0x070b16, alpha: 0.92 })
      .stroke({ width: 2, color: colorInfo.hex, alpha: 0.9 });
  };

  const lineNum = Number(activeLine.lineId) + 1;
  const countPrefix =
    winningLines.length > 1
      ? `(${activeLineIdx + 1}/${winningLines.length}) `
      : "";
  const bannerText = `${countPrefix}LINE ${lineNum} WIN: +${activeLine.winAmount}`;

  return (
    <pixiContainer>
      <pixiGraphics draw={drawLines} />
      <pixiText
        text={bannerText}
        x={0}
        y={-198}
        anchor={0.5}
        style={{
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          fontSize: 16,
          fontWeight: "bold",
          fill: colorInfo.hex,
          letterSpacing: 1,
        }}
      />
    </pixiContainer>
  );
}
