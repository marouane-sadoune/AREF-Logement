import { HousingDossier } from '../types/housing';

// A dossier is "closed" once it reaches a final decision (approved/rejected).
// The closure date is the official decision date when available, otherwise
// the date of the last audit-history entry that settled the file.
export function getClosureDate(d: HousingDossier): string | undefined {
  if (d.status !== 'approved' && d.status !== 'rejected') return undefined;
  const fromDecision = d.arefDecision?.pvDecisionDate || d.arefDecision?.commissionDate;
  if (fromDecision) return fromDecision;
  const finalEntry = [...d.auditHistory].reverse().find((h) => h.stage === 'final_decision');
  return finalEntry?.date;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// True when the file was closed more than a year ago and can be archived.
export function isArchivable(d: HousingDossier, now: Date = new Date()): boolean {
  const closed = getClosureDate(d);
  if (!closed) return false;
  const t = new Date(closed).getTime();
  if (Number.isNaN(t)) return false;
  return now.getTime() - t > ONE_YEAR_MS;
}

// How long ago the file was closed, in a short human label (Arabic).
export function closureAgeLabel(d: HousingDossier, now: Date = new Date()): string {
  const closed = getClosureDate(d);
  if (!closed) return '';
  const months = Math.max(0, Math.floor((now.getTime() - new Date(closed).getTime()) / (30 * 24 * 60 * 60 * 1000)));
  if (months < 12) return `${months} شهراً`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} سنة و${rem} شهراً` : `${years} سنة`;
}
