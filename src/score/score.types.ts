// Types for the HUD Weighted Calculator. These files are not wired into the UI yet
// and can be imported from build tooling or used in browser via a bundler.

export type Severity = 'LOW' | 'MODERATE' | 'SEVERE' | 'LIFE THREATENING';
export type HCV = 'PASS' | 'FAIL';
export type Location = 'UNIT' | 'INSIDE' | 'OUTSIDE';

export interface DeficiencyObservation {
  // NSPIRE standard ID (e.g., "STD-02") and deficiency ID (e.g., "STD-02-1")
  standardId: string;
  deficiencyId: string;
  severity: Severity;
  hcv: HCV;
  // One or more locations the deficiency applies to
  locations: Location[];
  // Optional count of occurrences (defaults to 1)
  count?: number;
}

export interface WeightsTable {
  severity: Record<Severity, number>;
  hcv: Record<HCV, number>;
  // Weight applied per location; when multiple locations exist, their average is used by default.
  location: Partial<Record<Location, number>>;
  // Baseline weight per standard (overrides `standardBase.default`), e.g. { 'STD-02': 10 }
  standardBase?: Record<string, number>;
}

export interface WeightRules {
  // Optional cap applied to a single observation impact (after weights applied)
  singleObservationCap?: number;
  // Optional cap applied to the total impact across all observations
  totalCap?: number;
  // If true, any observation with HCV FAIL forces the observation impact to this fixed value (e.g., 0 or a high penalty)
  hcvFailOverrideValue?: number;
}

export interface WeightsFile {
  version?: string;
  description?: string;
  weights: WeightsTable;
  rules?: WeightRules;
}

export interface ObservationImpactBreakdown {
  deficiencyId: string;
  standardId: string;
  count: number;
  base: number;
  severityWeight: number;
  hcvWeight: number;
  locationWeight: number; // averaged when there are multiple locations
  raw: number; // (base * severityWeight) + hcvWeight + locationWeight
  total: number; // raw * count, after rule overrides/caps
}

export interface ScoreResult {
  total: number;
  observations: ObservationImpactBreakdown[];
}
