// removed
// sampling.ts
// Paste the JSON you generated from the Excel into this file:
export const HUD_SAMPLING_TABLE: { min: number; max: number | null; sample: number }[] = [
  { "min": 1,  "max": 1,  "sample": 1 },
  { "min": 2,  "max": 2,  "sample": 2 },
  { "min": 3,  "max": 3,  "sample": 3 },
  { "min": 4,  "max": 4,  "sample": 4 },
  { "min": 5,  "max": 5,  "sample": 5 },
  { "min": 6,  "max": 7,  "sample": 6 },
  { "min": 8,  "max": 8,  "sample": 7 },
  { "min": 9,  "max": 10, "sample": 8 },
  { "min": 11, "max": 12, "sample": 9 },
  { "min": 13, "max": 14, "sample": 10 },
  { "min": 15, "max": 16, "sample": 11 },
  { "min": 17, "max": 18, "sample": 12 },
  { "min": 19, "max": 21, "sample": 13 },
  { "min": 22, "max": 24, "sample": 14 },
  { "min": 25, "max": 27, "sample": 15 },
  // …continue with the rest of your rows…
];

export function sampleSizeFor(totalUnits: number): number {
  if (!totalUnits || totalUnits < 1) return 0;
  const row = HUD_SAMPLING_TABLE.find(r =>
    totalUnits >= r.min && (r.max == null || totalUnits <= r.max)
  );
  return row ? row.sample : 0;
}
