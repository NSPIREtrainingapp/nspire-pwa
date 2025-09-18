// HUD Weighted Calculator: impact computation helpers
// This module is framework-agnostic. In browser, load weights via fetch.

import type {
  DeficiencyObservation,
  WeightsFile,
  WeightsTable,
  WeightRules,
  ObservationImpactBreakdown,
  ScoreResult,
  Severity,
  HCV,
  Location,
} from './score.types';

const DEFAULT_BASE = 1;

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function resolveBase(standardId: string, weights: WeightsTable): number {
  if (weights.standardBase && typeof weights.standardBase[standardId] === 'number') {
    return weights.standardBase[standardId];
  }
  return DEFAULT_BASE;
}

function severityW(sev: Severity, weights: WeightsTable): number {
  return weights.severity?.[sev] ?? 0;
}

function hcvW(hcv: HCV, weights: WeightsTable): number {
  return weights.hcv?.[hcv] ?? 0;
}

function locationW(locs: Location[], weights: WeightsTable): number {
  if (!Array.isArray(locs) || !locs.length) return 0;
  const values = locs
    .map((l) => weights.location?.[l])
    .filter((v): v is number => typeof v === 'number');
  return values.length ? avg(values) : 0;
}

function applyRules(rawTotal: number, obs: DeficiencyObservation, rules?: WeightRules): number {
  let val = rawTotal;
  if (!rules) return val;

  if (obs.hcv === 'FAIL' && typeof rules.hcvFailOverrideValue === 'number') {
    val = rules.hcvFailOverrideValue;
  }
  if (typeof rules.singleObservationCap === 'number') {
    val = Math.min(val, rules.singleObservationCap);
  }
  return val;
}

export function calculateObservationImpact(
  obs: DeficiencyObservation,
  weights: WeightsTable,
  rules?: WeightRules,
): ObservationImpactBreakdown {
  const base = resolveBase(obs.standardId, weights);
  const sW = severityW(obs.severity, weights);
  const hW = hcvW(obs.hcv, weights);
  const lW = locationW(obs.locations, weights);

  const raw = base * sW + hW + lW;
  const count = obs.count ?? 1;
  const totalPer = applyRules(raw, obs, rules);
  const total = totalPer * count;

  return {
    deficiencyId: obs.deficiencyId,
    standardId: obs.standardId,
    count,
    base,
    severityWeight: sW,
    hcvWeight: hW,
    locationWeight: lW,
    raw,
    total,
  };
}

export function calculateScore(
  observations: DeficiencyObservation[],
  weightsFile: WeightsFile,
): ScoreResult {
  const weights = weightsFile.weights;
  const rules = weightsFile.rules;
  const breakdowns = observations.map((o) => calculateObservationImpact(o, weights, rules));
  let total = breakdowns.reduce((sum, b) => sum + b.total, 0);
  if (rules?.totalCap != null) total = Math.min(total, rules.totalCap);
  return { total, observations: breakdowns };
}

// Convenience loader for browser usage. Pass a basePath (default '.')
export async function loadWeights(basePath = '.') : Promise<WeightsFile> {
  const res = await fetch(`${basePath.replace(/\/$/, '')}/src/score/weights.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load weights.json: ${res.status}`);
  return res.json();
}
