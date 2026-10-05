export const reelSymbols = [
  "ten",
  "jack",
  "grape",
  "khinkali",
  "sufra",
  "dance",
  "grape",
  "freespins1",
  "freespins2",
];

export const availableBets = [10, 20, 50, 100, 200, 500];

export const FRAME_CONFIG = {
  WIDTH: 1270,
  HEIGHT: 720,
  INNER_WIDTH: 800,
  INNER_HEIGHT: 437,
  INNER_OFFSET_X: 0,
  INNER_OFFSET_Y: -6,
};

export const REEL_CONFIG = {
  NUM_REELS: 5,
  NUM_ROWS: 3,
  BUFFER_ROWS: 0,
  SYMBOL_WIDTH: 140,
  SYMBOL_HEIGHT: 140,
  REEL_GAP: 20,
  ROW_GAP: 8,
  //
  START_X: -390,
  START_Y: -224,
};

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
