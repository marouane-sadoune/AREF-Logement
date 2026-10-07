import React from 'react';
import { ArchiveRestore, Archive, Eye, Trash2 } from 'lucide-react';
import { HousingDossier } from '../types/housing';
import { getClosureDate } from '../utils/archive';

interface ArchiveViewProps {
  archivedDossiers: HousingDossier[];
  onRestore: (id: string) => void;
  onSelectDossier: (dossier: HousingDossier) => void;
  onDeleteDossier: (id: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  archivedDossiers,
  onRestore,
  onSelectDossier,
  onDeleteDossier,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Archive className="w-4 h-4 text-slate-500" />
          <h1 className="text-xl font-extrabold text-slate-900">أرشيف الملفات المغلقة</h1>
        </div>
        <p className="text-xs text-slate-600">
          الملفات التي أُغلقت (مصادق عليها أو مرفوضة) منذ أكثر من سنة تُنقل إلى هذا الأرشيف لتخفيف قائمة الملفات النشطة، مع إمكانية استرجاعها في أي وقت.
        </p>
      </div>

      {archivedDossiers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Archive className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">الأرشيف فارغ حالياً</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            لم يتم أرشفة أي ملف بعد. يمكنك أرشفة الملفات المغلقة منذ أكثر من سنة من سجل الملفات.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {archivedDossiers.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {d.referenceNumber}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                    d.status === 'approved'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}>
                    {d.status === 'approved' ? 'مصادق عليه' : 'مرفوض'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    تاريخ الإغلاق: {getClosureDate(d) || '—'}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{d.candidate.fullNameAr}</div>
                <div className="text-xs text-slate-500">
                  {d.candidate.grade} · {d.candidate.directionProvinciale}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectDossier(d)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة</span>
                </button>
                <button
                  onClick={() => onRestore(d.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArchiveRestore className="w-3.5 h-3.5" />
                  <span>استرجاع</span>
                </button>
                <button
                  onClick={() => onDeleteDossier(d.id)}
                  title="حذف نهائي"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
