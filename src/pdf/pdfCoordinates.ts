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
    species: 608,
    statAlignment: 579,
    ability: 551,
    item: 528,
    moves: [500, 477, 454, 431] as [number, number, number, number]
  },
  {
    species: 407,
    statAlignment: 378,
    ability: 350,
    item: 327,
    moves: [299, 276, 253, 230] as [number, number, number, number]
  },
  {
    species: 206,
    statAlignment: 177,
    ability: 149,
    item: 126,
    moves: [98, 75, 52, 43] as [number, number, number, number]
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
  playerName: { x: 140, y: 704, maxWidth: 170 },
  trainerName: { x: 140, y: 681, maxWidth: 170 },
  teamName: { x: 140, y: 658, maxWidth: 170 },
  switchProfileName: { x: 140, y: 635, maxWidth: 170 },
  playerId: { x: 430, y: 681, maxWidth: 145 },
  dateOfBirth: { x: 430, y: 658, maxWidth: 145 },
  supportId: { x: 430, y: 635, maxWidth: 145 },
  division: {
    Junior: { x: 474, y: 703 },
    Senior: { x: 529, y: 703 },
    Master: { x: 583, y: 703 }
  }
} as const;
