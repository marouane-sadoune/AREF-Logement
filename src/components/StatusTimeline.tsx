import React from 'react';
import { CheckCircle, Clock, Send, XCircle, FileText } from 'lucide-react';
import { HousingDossier, DossierStatus } from '../types/housing';

const STAGES: { status: DossierStatus; label: string }[] = [
  { status: 'draft', label: 'مسودة' },
  { status: 'submitted_dp', label: 'مودع بالمديرية' },
  { status: 'under_review_dp', label: 'تدقيق DP' },
  { status: 'transmitted_aref', label: 'إحالة AREF' },
  { status: 'approved', label: 'مصادق عليه' },
];

function stageDate(dossier: HousingDossier, status: DossierStatus): string | undefined {
  const match = dossier.auditHistory.find((h) => h.stage === statusToStage(status));
  if (match?.date) return String(match.date).slice(0, 10);
  if (status === 'draft') return dossier.creationDate;
  if (status === 'approved' || status === 'rejected') {
    const d = dossier.arefDecision?.pvDecisionDate || dossier.arefDecision?.commissionDate;
    if (d) return String(d).slice(0, 10);
  }
  return undefined;
}

function statusToStage(status: DossierStatus): string {
  switch (status) {
    case 'draft': return 'creation';
    case 'submitted_dp': return 'submission_dp';
    case 'under_review_dp': return 'audit_dp';
    case 'transmitted_aref': return 'transmission_aref';
    case 'approved':
    case 'rejected': return 'final_decision';
    default: return '';
  }
}

export const StatusTimeline: React.FC<{ dossier: HousingDossier }> = ({ dossier }) => {
  const isRejected = dossier.status === 'rejected';
  const currentIdx = STAGES.findIndex((s) => s.status === dossier.status);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-800 mb-4">مسار معالجة الملف (DP ← AREF ← القرار):</h3>
      <ol className="relative border-r-2 border-slate-200 mr-2 space-y-4">
        {STAGES.map((stage, idx) => {
          const reached = isRejected ? idx <= 3 : idx <= (currentIdx === -1 ? 0 : currentIdx);
          const isCurrent = stage.status === dossier.status;
          const date = reached ? stageDate(dossier, stage.status) : undefined;
          return (
            <li key={stage.status} className="mr-4">
              <span className={`absolute -right-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white ${
                isCurrent ? 'bg-emerald-600' : reached ? 'bg-emerald-400' : 'bg-slate-300'
              }`}>
                {isCurrent && <CheckCircle className="w-3 h-3 text-white" />}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${reached ? 'text-slate-900' : 'text-slate-400'}`}>
                  {stage.label}
                </span>
                {date && <span className="font-mono text-[10px] text-slate-400">{date}</span>}
                {isCurrent && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">الحالية</span>
                )}
              </div>
            </li>
          );
        })}
        {isRejected && (
          <li className="mr-4">
            <span className="absolute -right-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white bg-rose-500">
              <XCircle className="w-3 h-3 text-white" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700">مرفوض</span>
              {(dossier.arefDecision?.pvDecisionDate || dossier.arefDecision?.commissionDate) && (
                <span className="font-mono text-[10px] text-slate-400">
                  {String(dossier.arefDecision?.pvDecisionDate || dossier.arefDecision?.commissionDate).slice(0, 10)}
                </span>
              )}
              <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">الحالية</span>
            </div>
          </li>
        )}
      </ol>
    </div>
  );
};
