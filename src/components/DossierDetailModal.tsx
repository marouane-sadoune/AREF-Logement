import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Send, 
  FileCheck, 
  Building, 
  User, 
  Users, 
  Home, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Stamp,
  Award
} from 'lucide-react';
import { HousingDossier } from '../types/housing';
import { DocumentChecklistView } from './DocumentChecklistView';

interface DossierDetailModalProps {
  dossier: HousingDossier;
  onClose: () => void;
  onUpdateDossier: (dossier: HousingDossier) => void;
  onOpenAudit: (dossier: HousingDossier) => void;
  onPrintDocuments: (dossier: HousingDossier) => void;
  onNavigateToDocumentGenerator: (docType: string) => void;
}

export const DossierDetailModal: React.FC<DossierDetailModalProps> = ({
  dossier,
  onClose,
  onUpdateDossier,
  onOpenAudit,
  onPrintDocuments,
  onNavigateToDocumentGenerator
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'info' | 'bareme' | 'history'>('checklist');

  const { candidate, situationFamiliale, housingRequest, bareme } = dossier;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50">
                {dossier.referenceNumber}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">
                {housingRequest.housingType === 'fonction' ? 'سكن وظيفي' : 'سكن إداري'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>{candidate.fullNameAr}</span>
              <span className="text-xs font-normal text-slate-400 font-sans">({candidate.fullNameFr})</span>
              <span className="text-slate-400 text-sm">·</span>
              <span className="text-xs font-semibold text-emerald-300">{candidate.grade}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {dossier.status === 'approved' && onNavigateToDocumentGenerator && (
              <button
                onClick={() => onNavigateToDocumentGenerator('accord_attribution')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="معاينة وطباعة رسالة الموافقة الرسمية الصادرة عن مديرة الأكاديمية"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>رسالة الموافقة (AREF)</span>
              </button>
            )}

            <button
              onClick={() => onPrintDocuments(dossier)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الوثائق</span>
            </button>

            <button
              onClick={() => onOpenAudit(dossier)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>مسار التدقيق</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            تدقيق الوثائق الست الإلزامية
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            بيانات المترشح والسكن
          </button>

          <button
            onClick={() => setActiveTab('bareme')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'bareme'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            تفاصيل شبكة التنقيط ({bareme.totalPts} نقطة)
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            سجل وتاريخ المعالجة
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'checklist' && (
            <DocumentChecklistView
              dossier={dossier}
              onUpdateDossier={onUpdateDossier}
              onNavigateToDocumentGenerator={onNavigateToDocumentGenerator}
            />
          )}

          {activeTab === 'info' && (
            <div className="space-y-5 text-xs">
              {/* Candidate Info Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>البيانات الإدارية والمهنية</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><span className="text-slate-500">رقم التأجير (PPR):</span> <strong className="font-mono text-slate-800">{candidate.ppr}</strong></div>
                  <div><span className="text-slate-500">رقم ب.ت.و (CIN):</span> <strong className="font-mono text-slate-800">{candidate.cin}</strong></div>
                  <div><span className="text-slate-500">الإطار الحالي:</span> <strong className="text-slate-800">{candidate.grade}</strong></div>
                  <div><span className="text-slate-500">السلم والرتبة:</span> <strong>السلم {candidate.scale} · الرتبة {candidate.echelon}</strong></div>
                  <div><span className="text-slate-500">الأقدمية العامة:</span> <strong>{candidate.seniorityGeneral} سنة</strong></div>
                  <div><span className="text-slate-500">الأقدمية بالمؤسسة:</span> <strong>{candidate.seniorityEtablissement} سنوات</strong></div>
                  <div><span className="text-slate-500">مقر العمل:</span> <strong>{candidate.currentEtablissement}</strong></div>
                  <div><span className="text-slate-500">المديرية الإقليمية:</span> <strong>{candidate.directionProvinciale}</strong></div>
                  <div><span className="text-slate-500">الأكاديمية الجهوية:</span> <strong>{candidate.aref}</strong></div>
                </div>
              </div>

              {/* Family Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>الوضع العائلي (Situation Familiale)</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><span className="text-slate-500">الحالة العائلية:</span> <strong>{situationFamiliale.maritalStatus === 'marie' ? 'متزوج(ة)' : 'عازب(ة)'}</strong></div>
                  <div><span className="text-slate-500">اسم الزوج(ة):</span> <strong>{situationFamiliale.spouseName || 'غير مسجل'}</strong></div>
                  <div><span className="text-slate-500">وظيفة الزوج(ة):</span> <strong>{situationFamiliale.spouseIsPublicOfficial ? (situationFamiliale.spouseAdministration || 'موظف عمومي') : 'لا يمارس وظيفة عمومية'}</strong></div>
                  <div><span className="text-slate-500">عدد الأطفال المعالين:</span> <strong className="font-mono">{situationFamiliale.childrenCount} أطفال</strong></div>
                </div>
              </div>

              {/* Housing Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>السكن المطلوب ومواصفاته</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><span className="text-slate-500">نوع السكن:</span> <strong>{housingRequest.housingType === 'fonction' ? 'سكن وظيفي' : 'سكن إداري'}</strong></div>
                  <div><span className="text-slate-500">المؤسسة المستهدفة:</span> <strong>{housingRequest.targetEtablissement}</strong></div>
                  <div><span className="text-slate-500">صنف السكن:</span> <strong>{housingRequest.housingCategory}</strong></div>
                  <div className="md:col-span-3"><span className="text-slate-500">العنوان بدقة:</span> <strong>{housingRequest.housingAddress}</strong></div>
                  <div className="md:col-span-3"><span className="text-slate-500">دواعي الطلب:</span> <span>{housingRequest.reasons}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bareme' && (
            <div className="space-y-4">
              <div className="bg-emerald-950 text-white p-5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-300 font-medium">مجموع نقط الاستحقاق حسب المذكرة 40</div>
                  <h3 className="text-xl font-bold mt-1">الرصيد الإجمالي المعياري</h3>
                </div>
                <div className="text-4xl font-mono font-extrabold text-emerald-300">
                  {bareme.totalPts} <span className="text-sm font-normal text-emerald-200">نقطة</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="bg-slate-100 text-slate-800">
                    <tr>
                      <th className="p-3 text-right">عنصر التنقيط</th>
                      <th className="p-3">القاعدة المعتمدة بالمذكرة 40</th>
                      <th className="p-3">وضعية المترشح</th>
                      <th className="p-3 font-bold">النقط الممنوحة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 text-right font-medium">الأقدمية العامة في قطاع التعليم</td>
                      <td className="p-3 text-slate-500">1 نقطة عن كل سنة خدمة</td>
                      <td className="p-3 font-mono">{candidate.seniorityGeneral} سنة</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{bareme.seniorityGeneralPts}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-right font-medium">الأقدمية في المؤسسة الحالية</td>
                      <td className="p-3 text-slate-500">2 نقط عن كل سنة خدمة</td>
                      <td className="p-3 font-mono">{candidate.seniorityEtablissement} سنوات</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{bareme.seniorityEtablissementPts}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-right font-medium">السلم الإداري</td>
                      <td className="p-3 text-slate-500">خارج السلم (12) / سلم 11 (10) / سلم 10 (8)</td>
                      <td className="p-3 font-mono">السلم {candidate.scale}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{bareme.scalePts}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-right font-medium">الوضعية العائلية</td>
                      <td className="p-3 text-slate-500">متزوج (4) / أرمل أو مطلق (4) / عازب (1)</td>
                      <td className="p-3">{situationFamiliale.maritalStatus}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{bareme.maritalPts}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-right font-medium">الأطفال المعالون</td>
                      <td className="p-3 text-slate-500">2 نقط عن كل طفل معال (بحد أقصى 8 نقط)</td>
                      <td className="p-3 font-mono">{situationFamiliale.childrenCount} أطفال</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{bareme.childrenPts}</td>
                    </tr>
                    {housingRequest.housingType === 'fonction' && (
                      <tr className="bg-amber-50">
                        <td className="p-3 text-right font-medium">امتياز السكن الوظيفي وضرورة المصلحة</td>
                        <td className="p-3 text-slate-500">أسبقية لمسؤولي الإدارة التربوية والمالية</td>
                        <td className="p-3">{candidate.grade}</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">+{bareme.responsibilityBonus}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800">المراحل والقرارات المسجلة على هذا الملف:</h3>
              <div className="space-y-2">
                {dossier.auditHistory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.decision}</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.date}</span>
                    </div>
                    <div className="text-slate-600">{item.comment}</div>
                    <div className="text-[10px] text-slate-400 pt-0.5">بواسطة: {item.actor}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
