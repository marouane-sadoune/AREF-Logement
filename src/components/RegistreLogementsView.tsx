import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Check,
  X,
  Home,
  AlertTriangle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  RegistreLogement,
  LogementStatut,
  EtatBatiment,
  HousingType,
  LOGEMENT_STATUT_LABELS,
  ETAT_BATIMENT_LABELS,
  MOROCCAN_DIRECTORATES,
} from '../types/housing';
import {
  fetchLogements,
  createLogement,
  updateLogement,
  deleteLogement,
} from '../api/client';

const EMPTY_FORM: Partial<RegistreLogement> = {
  numero_logement: '',
  etablissement: '',
  direction_provinciale: '',
  type_logement: 'fonction',
  categorie: '',
  adresse: '',
  nombre_pieces: 0,
  capacite_personnes: 0,
  statut: 'vacant',
  etat_batiment: 'bon',
  observations: '',
};

const STATUT_COLORS: Record<LogementStatut, string> = {
  vacant: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  occupe: 'bg-blue-100 text-blue-800 border-blue-200',
  en_maintenance: 'bg-amber-100 text-amber-800 border-amber-200',
  reserve: 'bg-purple-100 text-purple-800 border-purple-200',
  desaffecte: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const RegistreLogementsView: React.FC = () => {
  const [logements, setLogements] = useState<RegistreLogement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDp, setFilterDp] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<RegistreLogement>>(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchLogements({
        dp: filterDp || undefined,
        statut: filterStatut || undefined,
        q: searchQ || undefined,
      });
      setLogements(res.data);
    } catch {
      // silent — empty list on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterDp, filterStatut]);

  const handleSearch = () => load();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (l: RegistreLogement) => {
    setForm({ ...l });
    setEditingId(l.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.numero_logement || !form.etablissement || !form.direction_provinciale || !form.categorie) {
      Swal.fire({ icon: 'warning', title: 'حقول إلزامية', text: 'رقم السكن، المؤسسة، المديرية الإقليمية والصنف حقول واجبة.' });
      return;
    }
    try {
      if (editingId) {
        await updateLogement(editingId, form);
        Swal.fire({ icon: 'success', title: 'تم التحديث', timer: 1200, showConfirmButton: false });
      } else {
        await createLogement(form);
        Swal.fire({ icon: 'success', title: 'تمت الإضافة', timer: 1200, showConfirmButton: false });
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: err?.message || 'تعذرت العملية' });
    }
  };

  const handleDelete = async (id: number, label: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `حذف السكن ${label}؟`,
      text: 'لا يمكن التراجع عن هذا الإجراء.',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteLogement(id);
      Swal.fire({ icon: 'success', title: 'تم الحذف', timer: 1000, showConfirmButton: false });
      load();
    } catch {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'تعذر الحذف' });
    }
  };

  const stats = {
    total: logements.length,
    vacant: logements.filter(l => l.statut === 'vacant').length,
    occupe: logements.filter(l => l.statut === 'occupe').length,
    maintenance: logements.filter(l => l.statut === 'en_maintenance').length,
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>المسجل المركزي للمساكن (Registre des Logements)</span>
          </h2>
          <p className="text-xs text-slate-500">
            الجرد الرسمي للمساكن الإدارية والوظيفية وفق المذكرة الوزارية رقم 40
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سكن للسجل</span>
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <div className="text-2xl font-mono font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500">إجمالي المساكن</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center">
          <div className="text-2xl font-mono font-bold text-emerald-700">{stats.vacant}</div>
          <div className="text-[11px] text-emerald-600">شاغرة</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-200 text-center">
          <div className="text-2xl font-mono font-bold text-blue-700">{stats.occupe}</div>
          <div className="text-[11px] text-blue-600">مشغولة</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-amber-200 text-center">
          <div className="text-2xl font-mono font-bold text-amber-700">{stats.maintenance}</div>
          <div className="text-[11px] text-amber-600">قيد الصيانة</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">بحث</label>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="رقم السكن، المؤسسة، العنوان..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
            />
            <button onClick={handleSearch} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="w-full md:w-56">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">المديرية الإقليمية</label>
          <select
            value={filterDp}
            onChange={(e) => setFilterDp(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="">الكل</option>
            {MOROCCAN_DIRECTORATES.map(dp => <option key={dp} value={dp}>{dp}</option>)}
          </select>
        </div>
        <div className="w-full md:w-40">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">الحالة</label>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="">الكل</option>
            {(Object.entries(LOGEMENT_STATUT_LABELS) as [LogementStatut, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">جاري التحميل...</div>
        ) : logements.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">لا توجد مساكن مسجلة بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2.5 border-b border-slate-200">رقم السكن</th>
                  <th className="p-2.5 border-b border-slate-200">المؤسسة</th>
                  <th className="p-2.5 border-b border-slate-200">المديرية</th>
                  <th className="p-2.5 border-b border-slate-200">النوع</th>
                  <th className="p-2.5 border-b border-slate-200">الصنف</th>
                  <th className="p-2.5 border-b border-slate-200">الحالة</th>
                  <th className="p-2.5 border-b border-slate-200">حالة البناية</th>
                  <th className="p-2.5 border-b border-slate-200">المشغّل</th>
                  <th className="p-2.5 border-b border-slate-200 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logements.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-slate-900">{l.numero_logement}</td>
                    <td className="p-2.5 max-w-[180px] truncate" title={l.etablissement}>{l.etablissement}</td>
                    <td className="p-2.5 max-w-[140px] truncate text-slate-600" title={l.direction_provinciale}>{l.direction_provinciale}</td>
                    <td className="p-2.5">{l.type_logement === 'fonction' ? 'وظيفي' : 'إداري'}</td>
                    <td className="p-2.5">{l.categorie}</td>
                    <td className="p-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${STATUT_COLORS[l.statut]}`}>
                        {LOGEMENT_STATUT_LABELS[l.statut]}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{ETAT_BATIMENT_LABELS[l.etat_batiment]}</td>
                    <td className="p-2.5 font-mono text-slate-600">{l.occupant_ppr || '—'}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(l)} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-700 cursor-pointer" title="تعديل">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(l.id, l.numero_logement)} className="p-1 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-700 cursor-pointer" title="حذف">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                {editingId ? 'تعديل بيانات السكن' : 'إضافة سكن جديد للسجل'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">رقم السكن *</label>
                  <input
                    value={form.numero_logement || ''}
                    onChange={(e) => setForm({ ...form, numero_logement: e.target.value })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: LOG-OUJ-001"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">المديرية الإقليمية *</label>
                  <select
                    value={form.direction_provinciale || ''}
                    onChange={(e) => setForm({ ...form, direction_provinciale: e.target.value })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">اختر المديرية</option>
                    {MOROCCAN_DIRECTORATES.map(dp => <option key={dp} value={dp}>{dp}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">المؤسسة التعليمية *</label>
                <input
                  value={form.etablissement || ''}
                  onChange={(e) => setForm({ ...form, etablissement: e.target.value })}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="اسم المؤسسة"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">نوع السكن *</label>
                  <select
                    value={form.type_logement || 'fonction'}
                    onChange={(e) => setForm({ ...form, type_logement: e.target.value as HousingType })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="fonction">وظيفي</option>
                    <option value="administratif">إداري</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">الصنف *</label>
                  <input
                    value={form.categorie || ''}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="فيلا، شقة، سكن ملحق..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">عدد الغرف</label>
                  <input
                    type="number"
                    min={0}
                    value={form.nombre_pieces ?? 0}
                    onChange={(e) => setForm({ ...form, nombre_pieces: Number(e.target.value) })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">العنوان</label>
                <input
                  value={form.adresse || ''}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="العنوان الكامل للسكن"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">الحالة</label>
                  <select
                    value={form.statut || 'vacant'}
                    onChange={(e) => setForm({ ...form, statut: e.target.value as LogementStatut })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {(Object.entries(LOGEMENT_STATUT_LABELS) as [LogementStatut, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">حالة البناية</label>
                  <select
                    value={form.etat_batiment || 'bon'}
                    onChange={(e) => setForm({ ...form, etat_batiment: e.target.value as EtatBatiment })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {(Object.entries(ETAT_BATIMENT_LABELS) as [EtatBatiment, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">سعة الأشخاص</label>
                  <input
                    type="number"
                    min={0}
                    value={form.capacite_personnes ?? 0}
                    onChange={(e) => setForm({ ...form, capacite_personnes: Number(e.target.value) })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {form.statut === 'occupe' && (
                <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-800 mb-1">رقم تأجير المشغّل (PPR)</label>
                    <input
                      value={form.occupant_ppr || ''}
                      onChange={(e) => setForm({ ...form, occupant_ppr: e.target.value })}
                      className="w-full py-1.5 px-2.5 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-800 mb-1">تاريخ الإسناد</label>
                    <input
                      type="date"
                      value={form.date_attribution || ''}
                      onChange={(e) => setForm({ ...form, date_attribution: e.target.value })}
                      className="w-full py-1.5 px-2.5 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {form.statut === 'vacant' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">سبب الشغور</label>
                  <input
                    value={form.motif_vacance || ''}
                    onChange={(e) => setForm({ ...form, motif_vacance: e.target.value })}
                    className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="إفراغ، بناء جديد، صيانة منتهية..."
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={form.observations || ''}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer">
                إلغاء
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer">
                <Check className="w-4 h-4" />
                <span>{editingId ? 'حفظ التعديلات' : 'إضافة للسجل'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
