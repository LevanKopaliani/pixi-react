import { Assets, type Texture } from "pixi.js";
import { useEffect, useState } from "react";
import background from "@/assets/ui/background-image.jpg";

const GameBackground = () => {
  const [texture, setTexture] = useState<Texture | null>(null);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1270,
    height: typeof window !== "undefined" ? window.innerHeight : 720,
  });

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
    Assets.load(background)
      .then((tex) => {
        if (isMounted) setTexture(tex);
      })
      .catch((err) => {
        console.error("Failed to load background:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!texture) return null;

  const scale = Math.max(
    screenSize.width / texture.width,
    screenSize.height / texture.height,
  );
  const width = texture.width * scale;
  const height = texture.height * scale;

  return (
    <pixiSprite
      texture={texture}
      x={screenSize.width / 2}
      y={screenSize.height / 2}
      anchor={0.5}
      width={width}
      height={height}
    />
  );
};

export default GameBackground;
