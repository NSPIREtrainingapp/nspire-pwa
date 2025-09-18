// removed
// impact-engine.ts
import { DEFECT_SEVERITY_VALUE, type Severity, type Location } from "./defect-values";
import { sampleSizeFor } from "./sampling";

export type ImpactKey = `${string}|${Location}|${Severity}`;

export function makeImpactMap(
  totalUnits: number,
  defs: Array<{ code: string; location: string; severity: string }>
): Map<ImpactKey, number> {
  const map = new Map<ImpactKey, number>();
  const sample = sampleSizeFor(totalUnits);
  if (!sample) return map;

  for (const d of defs) {
    // Normalize per-row (you can also pre-normalize at import time)
    const loc = d.location as Location;
    const sev = d.severity as Severity;
    // Skip rows that aren’t normalized yet
    if (!DEFECT_SEVERITY_VALUE[sev]?.[loc]) continue;

    const value = DEFECT_SEVERITY_VALUE[sev][loc];
    const impact = +(value / sample).toFixed(2);
    map.set(`${d.code}|${loc}|${sev}`, impact);
  }
  return map;
}
