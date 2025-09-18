// removed
// defect-values.ts
export const DEFECT_SEVERITY_VALUE = {
  LT:     { OUTSIDE: 49.6, INSIDE: 54.5, UNIT: 60.0 },
  SEVERE: { OUTSIDE: 12.2, INSIDE: 13.4, UNIT: 14.8 },
  MOD:    { OUTSIDE: 4.5,  INSIDE: 5.0,  UNIT: 5.5  },
  LOW:    { OUTSIDE: 2.0,  INSIDE: 2.2,  UNIT: 2.4  },
} as const;

export type Severity = keyof typeof DEFECT_SEVERITY_VALUE; // 'LT'|'SEVERE'|'MOD'|'LOW'
export type Location = keyof typeof DEFECT_SEVERITY_VALUE["LT"]; // 'OUTSIDE'|'INSIDE'|'UNIT'
