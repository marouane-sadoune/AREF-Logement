import React, { useEffect, useMemo, useState } from 'react';
import { DoorOpen, Plus, Trash2, AlertTriangle, CalendarClock } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  HousingDossier,
  EvictionProcedure,
  EvictionCaseType,
  EvictionStatus,
  EVICTION_CASE_LABELS,
  EVICTION_STATUS_LABELS,
} from '../types/housing';
import * as api from '../api/client';

interface EvictionViewProps {
  dossiers: HousingDossier[];
}

const STATUS_STYLES: Record<EvictionStatus, string> = {
  notified: 'bg-blue-50 text-blue-800 border-blue-200',
  vacated: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  refused: 'bg-amber-50 text-amber-800 border-amber-200',
  rent_applied: 'bg-purple-50 text-purple-800 border-purple-200',
  disciplinary: 'bg-orange-50 text-orange-800 border-orange-200',
  judicial: 'bg-rose-50 text-rose-800 border-rose-200',
};

export const EvictionView: React.FC<EvictionViewProps> = ({ dossiers }) => {
  const [evictions, setEvictions] = useState<EvictionProcedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // New-procedure form state
  const [formDossier, setFormDossier] = useState('');
  const [formCase, setFormCase] = useState<EvictionCaseType>('cessation_travail');
  const [formTrigger, setFormTrigger] = useState(() => new Date().toISOString().slice(0, 10));
  const [formExtended, setFormExtended] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .fetchEvictions()
      .then(setEvictions)
      .catch((e) => Swal.fire({ icon: 'error', title: 'خطأ', text: 'تعذر تحميل مساطر الإفراغ: ' + e.message, confirmButtonText: 'حسناً' }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Only approved (occupied) dossiers can enter an eviction procedure.
  const occupiable = useMemo(
    () => dossiers.filter((d) => d.status === 'approved'),
    [dossiers]
  );

  const dossierByRef = useMemo(() => {
    const map = new Map<string, HousingDossier>();
    dossiers.forEach((d) => map.set(d.referenceNumber, d));
    return map;
  }, [dossiers]);

  const isOverdue = (p: EvictionProcedure) =>
    p.status !== 'vacated' && p.deadline_date !== null && new Date(p.deadline_date) < new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDossier) return;
    try {
      const created = await api.createEviction({
        numero_dossier: formDossier,
        case_type: formCase,
        trigger_date: formTrigger,
        deadline_extended: formExtended,
      });
      setEvictions((prev) => [created, ...prev]);
      setShowForm(false);
      setFormDossier('');
      setFormExtended(false);
      Swal.fire({ icon: 'success', title: 'تم بنجاح', text: 'تم فتح مسطرة الإفراغ', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل فتح المسطرة: ' + (err as Error).message, confirmButtonText: 'حسناً' });
    }
  };

  const handleStatus = async (p: EvictionProcedure, status: EvictionStatus) => {
    try {
      const updated = await api.updateEviction(p.id, { status });
      setEvictions((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل التحديث: ' + (err as Error).message, confirmButtonText: 'حسناً' });
    }
  };

  const handleVacate = async (p: EvictionProcedure) => {
    const { value: date } = await Swal.fire({
      title: 'تاريخ الإفراغ الفعلي',
      input: 'date',
      inputValue: new Date().toISOString().slice(0, 10),
      showCancelButton: true,
      confirmButtonText: 'تأكيد',
      cancelButtonText: 'إلغاء',
    });
    if (!date) return;
    try {
      const updated = await api.updateEviction(p.id, { status: 'vacated', vacate_date: date });
      setEvictions((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل التسجيل: ' + (err as Error).message, confirmButtonText: 'حسناً' });
    }
  };

  const handleDelete = async (p: EvictionProcedure) => {
    const ok = await Swal.fire({
      icon: 'warning',
      title: 'حذف مسطرة الإفراغ؟',
      text: 'سيتم حذف المسطرة نهائياً.',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626',
    });
    if (!ok.isConfirmed) return;
    try {
      await api.deleteEviction(p.id);
      setEvictions((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل الحذف: ' + (err as Error).message, confirmButtonText: 'حسناً' });
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">المذكرة 40 - المحور 4</span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">إفراغ المساكن الإدارية والوظيفية</h1>
          <p className="text-xs text-slate-600 mt-1">
            تتبع الحالات الموجبة للإفراغ والآجال القانونية (شهران / سنة / فوري) ومسطرات الامتناع (سومة كرائية، تأديبية، قضائية).
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          فتح مسطرة إفراغ
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-slate-700">
              الملف / المستفيد (المساكن المعتمد فقط)
              <select
                value={formDossier}
                onChange={(e) => setFormDossier(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-normal"
              >
                <option value="">-- اختر الملف --</option>
                {occupiable.map((d) => (
                  <option key={d.id} value={d.referenceNumber}>
                    {d.referenceNumber} - {d.candidate.fullNameAr}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              الحالة الموجبة للإفراغ
              <select
                value={formCase}
                onChange={(e) => setFormCase(e.target.value as EvictionCaseType)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-normal"
              >
                {(Object.keys(EVICTION_CASE_LABELS) as EvictionCaseType[]).map((k) => (
                  <option key={k} value={k}>{EVICTION_CASE_LABELS[k]}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              تاريخ الحدث الموجب (الانقطاع / التقاعد / ...)
              <input
                type="date"
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-normal"
              />
            </label>

            {formCase === 'retraite' && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 self-end pb-2">
                <input
                  type="checkbox"
                  checked={formExtended}
                  onChange={(e) => setFormExtended(e.target.checked)}
                  className="rounded border-slate-300"
                />
                تمديد الأجل إلى غاية تسلم المعاش
              </label>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer">
              حفظ المسطرة
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer">
              إلغاء
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-sm text-slate-500 py-10">جاري تحميل مساطر الإفراغ...</div>
      ) : evictions.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
          لا توجد مساطر إفراغ مفتوحة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evictions.map((p) => {
            const d = dossierByRef.get(p.numero_dossier);
            const overdue = isOverdue(p);
            return (
              <div key={p.id} className={`bg-white p-5 rounded-xl border shadow-xs space-y-3 ${overdue ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{p.numero_dossier}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${STATUS_STYLES[p.status]}`}>
                    {EVICTION_STATUS_LABELS[p.status]}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">{d?.candidate.fullNameAr || '—'}</h2>
                  <div className="text-xs text-slate-500">{d?.candidate.grade} · {d?.housingRequest.housingAddress || d?.candidate.currentEtablissement}</div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5 text-rose-600" />
                    <span className="font-bold">{EVICTION_CASE_LABELS[p.case_type]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>
                      الحدث: {p.trigger_date?.slice(0, 10)} · الأجل: {
                        p.deadline_date === null
                          ? 'ممدد إلى تسلم المعاش'
                          : p.deadline_months === 0
                            ? 'فوري (بدون أجل)'
                            : `${p.deadline_date.slice(0, 10)} (${p.deadline_months} شهر)`
                      }
                    </span>
                  </div>
                  {overdue && (
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      تجاوز الأجل القانوني للإفراغ
                    </div>
                  )}
                  {p.rent_amount != null && (
                    <div className="text-purple-700">السومة الكرائية المفروضة: {p.rent_amount} درهم</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatus(p, e.target.value as EvictionStatus)}
                    className="rounded-lg border border-slate-300 p-1.5 text-[11px]"
                  >
                    {(Object.keys(EVICTION_STATUS_LABELS) as EvictionStatus[]).map((k) => (
                      <option key={k} value={k}>{EVICTION_STATUS_LABELS[k]}</option>
                    ))}
                  </select>
                  <button onClick={() => handleVacate(p)} className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer">
                    تسجيل الإفراغ
                  </button>
                  <button onClick={() => handleDelete(p)} className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
