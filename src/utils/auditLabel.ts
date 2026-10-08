import { AuditHistoryEntry } from '../types/housing';

// Turns a persisted audit entry (decision like "Statut: under_review_dp" or
// "Création du dossier") into the real, human action label for the chip.
export function actionTitle(item: AuditHistoryEntry): string {
  const d = (item.decision || '').toLowerCase();
  if (d.includes('création') || d.includes('creation') || item.stage === 'creation') return 'إيداع الملف الأولي';
  if (d.includes('submitted_dp') || item.stage === 'submission_dp') return 'إيداع بمديرية الإقليم';
  if (d.includes('under_review_dp') || item.stage === 'audit_dp') return 'تدقيق ومطابقة الوثائق (DP)';
  if (d.includes('transmitted_aref') || item.stage === 'transmission_aref') return 'إحالة الملف إلى الأكاديمية';
  if (d.includes('commission') || item.stage === 'commission_aref') return 'لجنة الأكاديمية';
  if (d.includes('approved') || d.includes('accord') || d.includes('مصادقة') || d.includes('المصادقة')) return 'قرار المصادقة والتوقيع';
  if (d.includes('rejected') || d.includes('refus') || d.includes('رفض')) return 'قرار الرفض';
  if (d.includes('returned') || d.includes('إرجاع')) return 'إرجاع للتصحيح';
  return item.decision || 'إجراء إداري';
}
