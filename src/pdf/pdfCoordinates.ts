export type SlotCoordinates = {
  labelX: number;
  valueX: number;
  statX?: number;
  maxMainWidth: number;
  maxSpeciesWidth: number;
  y: {
    species: number;
    statAlignment: number;
    ability: number;
    item: number;
    moves: [number, number, number, number];
  };
};

export const pageSize = {
  width: 612,
  height: 792
};

const page1Y = [
  {
    species: 610,
    statAlignment: 582,
    ability: 560,
    item: 537,
    moves: [513, 490, 467, 444] as [number, number, number, number]
  },
  {
    species: 409,
    statAlignment: 381,
    ability: 359,
    item: 336,
    moves: [312, 289, 266, 243] as [number, number, number, number]
  },
  {
    species: 208,
    statAlignment: 180,
    ability: 158,
    item: 135,
    moves: [111, 88, 64, 44] as [number, number, number, number]
  }
];

export const staffSlots: SlotCoordinates[] = page1Y.flatMap((row) => [
  {
    labelX: 18,
    valueX: 108,
    statX: 247,
    maxMainWidth: 134,
    maxSpeciesWidth: 182,
    y: row
  },
  {
    labelX: 309,
    valueX: 399,
    statX: 538,
    maxMainWidth: 134,
    maxSpeciesWidth: 182,
    y: row
  }
]);

export const opponentSlots: SlotCoordinates[] = page1Y.flatMap((row) => [
  {
    labelX: 18,
    valueX: 108,
    maxMainWidth: 184,
    maxSpeciesWidth: 184,
    y: row
  },
  {
    labelX: 309,
    valueX: 399,
    maxMainWidth: 184,
    maxSpeciesWidth: 184,
    y: row
  }
]);

// Underline heights of the player info rows on the template. Text baselines sit
// TEXT_LIFT above them so descenders (g, j, p, q, y) clear the line.
const playerLineY = { playerName: 702.75, trainerName: 681.25, teamName: 660, switchProfileName: 635.5 };
const TEXT_LIFT = 4;

export const playerCoordinates = {
  playerName: { x: 146, y: playerLineY.playerName + TEXT_LIFT, maxWidth: 164 },
  trainerName: { x: 146, y: playerLineY.trainerName + TEXT_LIFT, maxWidth: 164 },
  teamName: { x: 146, y: playerLineY.teamName + TEXT_LIFT, maxWidth: 164 },
  switchProfileName: { x: 146, y: playerLineY.switchProfileName + TEXT_LIFT, maxWidth: 164 },
  playerId: { x: 436, y: playerLineY.trainerName + TEXT_LIFT, maxWidth: 139 },
  dateOfBirth: {
    month: { centerX: 454, y: playerLineY.teamName + TEXT_LIFT, maxWidth: 28 },
    day: { centerX: 507, y: playerLineY.teamName + TEXT_LIFT, maxWidth: 28 },
    year: { x: 552, y: playerLineY.teamName + TEXT_LIFT, maxWidth: 44 }
  },
  supportId: { x: 436, y: playerLineY.switchProfileName + TEXT_LIFT, maxWidth: 139 },
  division: {
    Junior: { centerX: 477.25, y: 705.5 },
    Senior: { centerX: 533, y: 705.5 },
    Master: { centerX: 582.75, y: 706 }
  }
} as const;
