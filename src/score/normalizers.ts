// removed
// normalizers.ts
import type { Severity, Location } from "./defect-values";

export function normalizeSeverity(s: string | undefined | null): Severity | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  if (['lt','life-threatening','life threatening','life_threatening'].includes(t)) return 'LT';
  if (['severe','s3','s-3'].includes(t)) return 'SEVERE';
  if (['moderate','mod','s2','s-2'].includes(t)) return 'MOD';
  if (['low','s1','s-1'].includes(t)) return 'LOW';
  return null;
}

export function normalizeLocation(l: string | undefined | null): Location | null {
  if (!l) return null;
  const t = l.trim().toLowerCase();
  if (['unit','in-unit','dwelling unit','unit area'].includes(t)) return 'UNIT';
  if (['inside','interior','inside building','common area - inside'].includes(t)) return 'INSIDE';
  if (['outside','exterior','site','common area - outside'].includes(t)) return 'OUTSIDE';
  return null;
}
