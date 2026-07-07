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

export const playerCoordinates = {
  playerName: { x: 140, y: 707, maxWidth: 170 },
  trainerName: { x: 140, y: 684, maxWidth: 170 },
  teamName: { x: 140, y: 661, maxWidth: 170 },
  switchProfileName: { x: 140, y: 638, maxWidth: 170 },
  playerId: { x: 430, y: 684, maxWidth: 145 },
  dateOfBirth: {
    month: { x: 430, y: 661, maxWidth: 28 },
    day: { x: 492, y: 661, maxWidth: 28 },
    year: { x: 552, y: 661, maxWidth: 44 }
  },
  supportId: { x: 430, y: 638, maxWidth: 145 },
  division: {
    Junior: { x: 474, y: 703 },
    Senior: { x: 529, y: 703 },
    Master: { x: 583, y: 703 }
  }
} as const;
