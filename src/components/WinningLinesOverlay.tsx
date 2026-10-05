import { useEffect, useState } from "react";
import { type Graphics as PixiGraphics } from "pixi.js";
import { useSlotGame } from "@/pokie/slot-controller";
import { LINE_COLORS, REEL_CONFIG } from "@/config";
import type { WinningLineInfo, WinningScatterInfo } from "@/types";

const SCATTER_COLOR = {
  hex: 0xffd700,
  hexStr: "#FFD700",
  name: "Scatter",
};

export default function WinningLinesOverlay() {
  const { winningLines, winningScatters = [], isSpinning } = useSlotGame();
  const [activeIdx, setActiveIdx] = useState(0);

  const hasLines = winningLines && winningLines.length > 0;
  const hasScatters = winningScatters && winningScatters.length > 0;
  const totalItems = (winningLines?.length ?? 0) + (winningScatters?.length ?? 0);

  useEffect(() => {
    setActiveIdx(0);
  }, [winningLines, winningScatters]);

  // Cycle through winning lines and winning scatters
  useEffect(() => {
    if (isSpinning || totalItems <= 1) return;

    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % totalItems);
    }, 2000);

    return () => clearInterval(interval);
  }, [totalItems, isSpinning]);

  if (isSpinning || totalItems === 0) {
    return null;
  }

  const isScatterActive = activeIdx >= (winningLines?.length ?? 0);
  const activeLine: WinningLineInfo | undefined = !isScatterActive
    ? winningLines[activeIdx]
    : undefined;
  const activeScatter: WinningScatterInfo | undefined = isScatterActive
    ? winningScatters[activeIdx - (winningLines?.length ?? 0)]
    : undefined;

  const colorInfo = activeLine
    ? LINE_COLORS[activeLine.lineId] || {
        hex: 0xffd700,
        hexStr: "#FFD700",
        name: `Line ${Number(activeLine.lineId) + 1}`,
      }
    : SCATTER_COLOR;

  // Coordinates helper
  const getCellCenter = (col: number, row: number) => {
    const pitchX = REEL_CONFIG.SYMBOL_WIDTH + REEL_CONFIG.REEL_GAP;
    const pitchY = REEL_CONFIG.SYMBOL_HEIGHT + REEL_CONFIG.ROW_GAP;
    return {
      x: REEL_CONFIG.START_X + col * pitchX + REEL_CONFIG.SYMBOL_WIDTH / 2,
      y: REEL_CONFIG.START_Y + row * pitchY + REEL_CONFIG.SYMBOL_HEIGHT / 2,
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

    if (activeLine) {
      // 1. Draw inactive winning lines faintly
      winningLines.forEach((wl, idx) => {
        if (idx === activeIdx) return;
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

      // 2. Draw full payline path
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

      // 3. Draw winning line segment
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

      // 4. Draw glowing highlight boxes and center nodes for line symbols
      participatingCols.forEach((col) => {
        const row = activeLine.definition[col];
        const box = getCellBox(col, row);
        const center = getCellCenter(col, row);

        g.roundRect(box.x, box.y, box.w, box.h, 14).fill({
          color: colorInfo.hex,
          alpha: 0.12,
        });

        g.roundRect(box.x - 2, box.y - 2, box.w + 4, box.h + 4, 16).stroke({
          width: 6,
          color: colorInfo.hex,
          alpha: 0.4,
        });

        g.roundRect(box.x, box.y, box.w, box.h, 14).stroke({
          width: 3,
          color: colorInfo.hex,
          alpha: 1.0,
        });

        g.circle(center.x, center.y, 8).fill({
          color: colorInfo.hex,
          alpha: 0.8,
        });
        g.circle(center.x, center.y, 4).fill({
          color: 0xffffff,
          alpha: 1.0,
        });
      });
    } else if (activeScatter) {
      // Draw highlight boxes for scatter symbols
      activeScatter.symbolsPositions.forEach(([col, row]) => {
        const box = getCellBox(col, row);
        const center = getCellCenter(col, row);

        g.roundRect(box.x, box.y, box.w, box.h, 14).fill({
          color: SCATTER_COLOR.hex,
          alpha: 0.2,
        });

        g.roundRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 18).stroke({
          width: 8,
          color: SCATTER_COLOR.hex,
          alpha: 0.5,
        });

        g.roundRect(box.x, box.y, box.w, box.h, 14).stroke({
          width: 3.5,
          color: 0xffffff,
          alpha: 0.95,
        });

        g.circle(center.x, center.y, 10).fill({
          color: SCATTER_COLOR.hex,
          alpha: 0.9,
        });
        g.circle(center.x, center.y, 5).fill({
          color: 0xffffff,
          alpha: 1.0,
        });
      });
    }

    // Banner pill at top of reels window
    const bannerW = 380;
    const bannerH = 34;
    const bannerX = -bannerW / 2;
    const bannerY = -215;

    g.roundRect(bannerX, bannerY, bannerW, bannerH, 17)
      .fill({ color: 0x070b16, alpha: 0.92 })
      .stroke({ width: 2, color: colorInfo.hex, alpha: 0.9 });
  };

  const countPrefix = totalItems > 1 ? `(${activeIdx + 1}/${totalItems}) ` : "";
  let bannerText = "";
  if (activeLine) {
    const lineNum = Number(activeLine.lineId) + 1;
    bannerText = `${countPrefix}LINE ${lineNum} WIN: +${activeLine.winAmount}`;
  } else if (activeScatter) {
    bannerText = `${countPrefix}SCATTER WIN: +${activeScatter.winAmount}`;
  }

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
