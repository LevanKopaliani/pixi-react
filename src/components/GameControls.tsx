import { Assets, Spritesheet, type Texture } from "pixi.js";
import { useEffect, useState, useMemo } from "react";
import desktopUIAtlas from "@/assets/ui/desktopUI.json";
import desktopUIImage from "@/assets/ui/desktopUI.png";
import { availableBets } from "@/config";
import { customGameSession } from "@/pokie";

import { useSlotGame } from "@/pokie/slot-controller";
import type { GameControlsProps } from "@/types";

const GameControls = ({
  onSpin,
  isSpinning = false,
  balance: propBalance,
  bet: propBet,
  win: propWin,
  onBetChange,
}: GameControlsProps) => {
  //
  const [sheet, setSheet] = useState<Spritesheet | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const slot = useSlotGame();
  const gameSession = customGameSession;

  // Sync bet, balance, win, and spinning states with slot controller or props
  const currentBet = propBet !== undefined ? propBet : slot.bet;
  const balance = propBalance !== undefined ? propBalance : slot.balance;
  const win = propWin !== undefined ? propWin : slot.win;
  const activeSpinning = isSpinning || slot.isSpinning;

  const currentBetIndex = useMemo(() => {
    const idx = availableBets.indexOf(currentBet);
    return idx >= 0 ? idx : 0;
  }, [currentBet]);

  useEffect(() => {
    let isMounted = true;

    Assets.load<Texture>(desktopUIImage)
      .then(async (texture) => {
        const spritesheet = new Spritesheet(texture, desktopUIAtlas);
        await spritesheet.parse();
        if (isMounted) {
          setSheet(spritesheet);
        }
      })
      .catch((error) => {
        console.error("Failed to load desktopUI spritesheet:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!sheet) {
    return null;
  }

  const { textures } = sheet;

  const handlePrevBet = () => {
    if (activeSpinning) return;
    if (currentBetIndex > 0) {
      const newBet = availableBets[currentBetIndex - 1];
      gameSession.setBet(newBet);
      slot.setBet(newBet);
      onBetChange?.(newBet);
    }
  };

  const handleNextBet = () => {
    if (activeSpinning) return;
    if (currentBetIndex < availableBets.length - 1) {
      const newBet = availableBets[currentBetIndex + 1];
      gameSession.setBet(newBet);
      slot.setBet(newBet);
      onBetChange?.(newBet);
    }
  };

  const handleSpinClick = () => {
    if (activeSpinning) return;
    if (!gameSession.canPlayNextGame()) {
      console.warn("Insufficient balance in gameSession to play");
      return;
    }
    if (onSpin) {
      onSpin();
    } else {
      slot.spin();
    }
  };

  // Determine textures based on state
  const isLeftDisabled = activeSpinning || currentBetIndex <= 0;
  const isRightDisabled =
    activeSpinning || currentBetIndex >= availableBets.length - 1;

  const arrowLTexture = isLeftDisabled
    ? textures["Arrow_L_Disabled.png"]
    : pressedButton === "arrow_l"
      ? textures["Arrow_L_Pressed.png"]
      : hoveredButton === "arrow_l"
        ? textures["Arrow_L_Hover.png"]
        : textures["Arrow_L_Idle.png"];

  const arrowRTexture = isRightDisabled
    ? textures["Arrow_R_Disabled.png"]
    : pressedButton === "arrow_r"
      ? textures["Arrow_R_Pressed.png"]
      : hoveredButton === "arrow_r"
        ? textures["Arrow_R_Hover.png"]
        : textures["Arrow_R_Idle.png"];

  const infoTexture =
    pressedButton === "info"
      ? textures["Info_Pressed.png"]
      : hoveredButton === "info"
        ? textures["Info_Hover.png"]
        : textures["Info_Idle.png"];

  const spinTexture = activeSpinning
    ? textures["Stop_Idle.png"]
    : pressedButton === "spin"
      ? textures["Spin_Pressed.png"]
      : hoveredButton === "spin"
        ? textures["Spin_Hover.png"]
        : textures["Spin_Idle.png"];

  const textStyle = {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    fontWeight: "bold" as const,
    fill: 0xffdf80,
    stroke: { color: 0x3d1702, width: 3 },
    align: "center" as const,
  };

  return (
    <pixiContainer x={0} y={322}>
      {/* 1. Info Button */}
      <pixiSprite
        texture={infoTexture}
        x={-480}
        y={0}
        anchor={0.5}
        width={64}
        height={64}
        eventMode="static"
        cursor="pointer"
        onPointerEnter={() => setHoveredButton("info")}
        onPointerLeave={() => {
          setHoveredButton(null);
          setPressedButton(null);
        }}
        onPointerDown={() => setPressedButton("info")}
        onPointerUp={() => setPressedButton(null)}
      />

      {/* 2. Balance Display */}
      <pixiContainer x={-315} y={0}>
        <pixiSprite
          texture={textures["woodframe.png"]}
          x={0}
          y={0}
          anchor={0.5}
          width={220}
          height={54}
        />
        <pixiSprite
          texture={textures["Balance_Text.png"]}
          x={0}
          y={-11}
          anchor={0.5}
          width={110}
          height={23}
        />
        <pixiText
          text={balance.toLocaleString()}
          style={textStyle}
          x={0}
          y={11}
          anchor={0.5}
        />
      </pixiContainer>

      {/* 3. Win Display */}
      <pixiContainer x={-95} y={0}>
        <pixiSprite
          texture={textures["woodframe.png"]}
          x={0}
          y={0}
          anchor={0.5}
          width={180}
          height={54}
        />
        <pixiSprite
          texture={textures["Win_Text.png"]}
          x={0}
          y={-11}
          anchor={0.5}
          width={50}
          height={23}
        />
        <pixiText
          text={win.toFixed(2)}
          style={textStyle}
          x={0}
          y={11}
          anchor={0.5}
        />
      </pixiContainer>

      {/* 4. Bet Display with Adjust Arrows */}
      <pixiContainer x={155} y={0}>
        {/* Left Arrow */}
        <pixiSprite
          texture={arrowLTexture}
          x={-105}
          y={0}
          anchor={0.5}
          width={44}
          height={46}
          rotation={Math.PI / 2}
          eventMode={isLeftDisabled ? "none" : "static"}
          cursor={isLeftDisabled ? "default" : "pointer"}
          onPointerEnter={() => !isLeftDisabled && setHoveredButton("arrow_l")}
          onPointerLeave={() => {
            setHoveredButton(null);
            setPressedButton(null);
          }}
          onPointerDown={() => !isLeftDisabled && setPressedButton("arrow_l")}
          onPointerUp={() => {
            setPressedButton(null);
            handlePrevBet();
          }}
        />

        {/* Center Frame with BET text and amount */}
        <pixiSprite
          texture={textures["woodframe.png"]}
          x={0}
          y={0}
          anchor={0.5}
          width={150}
          height={54}
        />
        <pixiSprite
          texture={textures["Bet_Text.png"]}
          x={0}
          y={-11}
          anchor={0.5}
          width={50}
          height={22}
        />
        <pixiText
          text={String(currentBet)}
          style={textStyle}
          x={0}
          y={11}
          anchor={0.5}
        />

        {/* Right Arrow */}
        <pixiSprite
          texture={arrowRTexture}
          x={105}
          y={0}
          anchor={0.5}
          width={44}
          height={46}
          rotation={Math.PI / 2}
          eventMode={isRightDisabled ? "none" : "static"}
          cursor={isRightDisabled ? "default" : "pointer"}
          onPointerEnter={() => !isRightDisabled && setHoveredButton("arrow_r")}
          onPointerLeave={() => {
            setHoveredButton(null);
            setPressedButton(null);
          }}
          onPointerDown={() => !isRightDisabled && setPressedButton("arrow_r")}
          onPointerUp={() => {
            setPressedButton(null);
            handleNextBet();
          }}
        />
      </pixiContainer>

      {/* 5. Spin Button */}
      <pixiSprite
        texture={spinTexture}
        x={420}
        y={0}
        anchor={0.5}
        width={115}
        height={115}
        eventMode="static"
        cursor="pointer"
        onPointerEnter={() => setHoveredButton("spin")}
        onPointerLeave={() => {
          setHoveredButton(null);
          setPressedButton(null);
        }}
        onPointerDown={() => setPressedButton("spin")}
        onPointerUp={() => {
          setPressedButton(null);
          handleSpinClick();
        }}
      />
    </pixiContainer>
  );
};

export default GameControls;
