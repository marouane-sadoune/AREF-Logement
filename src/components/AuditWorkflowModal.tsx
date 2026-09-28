import React, { useState } from 'react';
import { 
  GitFork, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertCircle, 
  FileCheck, 
  Building, 
  Stamp, 
  UserCheck, 
  FileText,
  Calendar,
  X,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Check,
  Printer
} from 'lucide-react';
import { HousingDossier, DossierStatus } from '../types/housing';
import { useAuth } from '../context/AuthContext';

interface AuditWorkflowModalProps {
  dossier: HousingDossier;
  onClose: () => void;
  onUpdateStatus: (
    updatedDossier: HousingDossier,
    newStatus: DossierStatus,
    comment: string,
    bordereauNumber?: string
  ) => void;
  onOpenApprovalLetter?: (dossier: HousingDossier) => void;
}

export const AuditWorkflowModal: React.FC<AuditWorkflowModalProps> = ({
  dossier,
  onClose,
  onUpdateStatus,
  onOpenApprovalLetter
}) => {
  const { currentUser, permissions } = useAuth();

  // Choose sensible default action based on role
  const defaultAction = 
    currentUser.role === 'dp_agent' ? 'transmit' :
    currentUser.role === 'aref_validator' ? 'validator_review' :
    currentUser.role === 'aref_director' ? 'approve' : 'dp_audit';

  const [activeAction, setActiveAction] = useState<string>(defaultAction);
  const [comment, setComment] = useState<string>('');
  const [bordereauNum, setBordereauNum] = useState<string>(
    dossier.dpAudit?.bordereauNumber || `BORD/${dossier.candidate.directionProvinciale.slice(0, 3)}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
  );
  const [decisionNum, setDecisionNum] = useState<string>(
    dossier.arefDecision?.decisionNumber || `DEC/AREF-OR/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
  );

  const steps = [
    {
      key: 'submitted_dp',
      title: '1. الإيداع والتدقيق بالمديرية (DP)',
      desc: 'إيداع ومعالجة الملف بمصلحة تدبير السكنيات بالمديرية الإقليمية.',
      isCurrent: dossier.status === 'submitted_dp' || dossier.status === 'draft',
      isPassed: ['under_review_dp', 'transmitted_aref', 'approved'].includes(dossier.status)
    },
    {
      key: 'transmitted_aref',
      title: '2. قفل الملف والإحالة على AREF',
      desc: 'قفل الملف وإرساله رسمياً بجدول إرسال من المديرية للأكاديمية.',
      isCurrent: dossier.status === 'transmitted_aref' && !dossier.arefDecision?.commissionDecision,
      isPassed: ['approved'].includes(dossier.status)
    },
    {
      key: 'aref_validation',
      title: '3. تدقيق وافتحاص الأكاديمية',
      desc: 'فحص المعطيات والنقط والوثائق من طرف مسؤول الأكاديمية (aref_validator).',
      isCurrent: dossier.status === 'transmitted_aref' && dossier.dpAudit?.isComplete,
      isPassed: dossier.status === 'approved'
    },
    {
      key: 'approved',
      title: '4. قرار المصادقة والتوقيع الرسمي',
      desc: 'المصادقة وتوقيع عقد ومقرر الإسناد من طرف السيد مدير الأكاديمية (aref_director).',
      isCurrent: dossier.status === 'approved',
      isPassed: false
    }
  ];

  // 1. DP Action: Audit and verify within DP
  const handleValidateDP = () => {
    const updated: HousingDossier = {
      ...dossier,
      status: 'under_review_dp',
      dpAudit: {
        ...dossier.dpAudit,
        auditedBy: `${currentUser.fullName} (${currentUser.title})`,
        auditDate: new Date().toISOString().split('T')[0],
        isComplete: true,
        dpNotes: comment || 'تم التدقيق والتأكد من مطابقة جميع الوثائق الست لمقتضيات المذكرة 40'
      }
    };
    onUpdateStatus(updated, 'under_review_dp', comment || `تدقيق ومطابقة الملف من طرف ${currentUser.fullName}`);
  };

  // 2. DP Action: Lock and transmit officially to AREF
  const handleTransmitAREF = () => {
    const updated: HousingDossier = {
      ...dossier,
      status: 'transmitted_aref',
      dpAudit: {
        ...dossier.dpAudit,
        isComplete: true,
        bordereauNumber: bordereauNum,
        auditedBy: `${currentUser.fullName} (${currentUser.title})`,
        transmissionDate: new Date().toISOString().split('T')[0],
        dpNotes: comment || `تم قفل الملف وإرساله رسمياً بجدول إرسال رقم ${bordereauNum}`
      }
    };
    onUpdateStatus(
      updated,
      'transmitted_aref',
      comment || `قفل الملف وإرساله رسمياً إلى الأكاديمية الجهوية (جدول إرسال: ${bordereauNum}) بواسطة ${currentUser.fullName}`,
      bordereauNum
    );
  };

  // 3. AREF Validator Action: Preliminary Approval or Return
  const handleValidatorApprove = () => {
    const updated: HousingDossier = {
      ...dossier,
      status: 'transmitted_aref',
      arefDecision: {
        commissionDate: new Date().toISOString().split('T')[0],
        commissionDecision: 'accord',
        decisionNumber: decisionNum,
        pvDecisionDate: new Date().toISOString().split('T')[0],
        arefNotes: comment || 'تم فحص الملف وتدقيق النقط والشروط: مؤشر عليه بالموافقة المبدئية للإحالة على السيد المدير'
      }
    };
    onUpdateStatus(
      updated,
      'transmitted_aref',
      comment || `موافقة مبدئية من مدقق الأكاديمية الجهوية (${currentUser.fullName}) وإحالة للمصادقة النهائية`
    );
  };

  const handleValidatorReturn = () => {
    const updated: HousingDossier = {
      ...dossier,
      status: 'under_review_dp',
      dpAudit: {
        ...dossier.dpAudit,
        isComplete: false,
        dpNotes: `إرجاع من الأكاديمية للتصحيح: ${comment || 'يرجى مراجعة وثائق الملف واستكمال الشروط'}`
      }
    };
    onUpdateStatus(
      updated,
      'under_review_dp',
      `إرجاع الملف إلى ${dossier.candidate.directionProvinciale} من طرف مدقق الأكاديمية: ${comment || 'يوجد نقص أو ملاحظات للتصحيح'}`
    );
  };

  // 4. AREF Director Action: Final Approval & Sovereign Attribution Decree
  const handleApproveAREF = () => {
    const updated: HousingDossier = {
      ...dossier,
      status: 'approved',
      arefDecision: {
        commissionDate: new Date().toISOString().split('T')[0],
        commissionDecision: 'accord',
        decisionNumber: decisionNum,
        pvDecisionDate: new Date().toISOString().split('T')[0],
        arefNotes: comment || 'صادق السيد مدير الأكاديمية الجهوية لجهة الشرق نهائياً على قرار الإسناد والترخيص بالسكن استناداً للمذكرة 40'
      }
    };
    onUpdateStatus(
      updated,
      'approved',
      comment || `المصادقة النهائية والتوقيع الرسمي لقرار الإسناد رقم ${decisionNum} من طرف السيد مدير الأكاديمية الجهوية لجهة الشرق`
    );
  };

  const handleReject = () => {
    const updated: HousingDossier = {
      ...dossier,
      status: 'rejected'
    };
    onUpdateStatus(updated, 'rejected', comment || 'ملف غير مستوفٍ للشروط القانونية المنصوص عليها بالمذكرة 40');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <GitFork className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  مسار التدقيق والتأشير الإداري (DPs ➔ AREF Oriental)
                </h2>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                الملف رقم: <strong className="font-mono text-emerald-400">{dossier.referenceNumber}</strong> · المترشح: {dossier.candidate.fullNameAr} ({dossier.candidate.directionProvinciale})
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Active User Context in Modal */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">المستخدم الحالي:</span>
              <strong className="text-slate-900">{currentUser.fullName}</strong>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                {currentUser.title}
              </span>
            </div>
            {currentUser.dpNameAr && (
              <span className="text-slate-600 font-bold">
                {currentUser.dpNameAr}
              </span>
            )}
          </div>

          {/* Official Letter Banner if approved */}
          {dossier.status === 'approved' && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تمت المصادقة النهائية على طلب السكن بنجاح!</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  تم توليد نموذج رسالة الموافقة الرسمية الموجهة للمدير الإقليمي بناءً على المذكرة الوزارية رقم 40.
                </p>
              </div>
              {onOpenApprovalLetter && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenApprovalLetter(dossier);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>معاينة وطباعة رسالة الموافقة (A4)</span>
                </button>
              )}
            </div>
          )}

          {/* Visual Step Pipeline */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-800">
              المراحل الإدارية لمعالجة الملف استناداً للمذكرة الوزارية 40:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {steps.map((s, idx) => (
                <div
                  key={s.key}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    s.isCurrent
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                      : s.isPassed
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {s.isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : s.isCurrent ? (
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                    )}
                    <span className="font-bold truncate">{s.title}</span>
                  </div>
                  <p className="text-[10px] leading-tight opacity-80">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Summary of Documents Verification */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>تدقيق الوثائق الست الإلزامية للملف:</span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                مجموع النقط: {dossier.bareme.totalPts} نقطة
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${dossier.documents.demandeManuscrite.present ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>الطلب الخطي</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${dossier.documents.copieCIN.present ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>نسخة ب.ت.و (CIN)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${dossier.documents.attestationTravail.present ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>شهادة العمل حديثة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${dossier.documents.situationFamiliale.present ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>الوضع العائلي والأبناء</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${dossier.documents.engagementHonneur.present ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>الالتزام مصحح الإمضاء</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${dossier.documents.pvInstallation.present ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>محضر الالتحاق (PV)</span>
              </div>
            </div>
          </div>

          {/* Action selection section tailored to Roles */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-800">
              اختر الإجراء الإداري المراد اتخاذه على هذا الملف:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* DP Agent Actions */}
              {(currentUser.role === 'dp_agent' || currentUser.role === 'dev') && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveAction('dp_audit')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-right transition-colors cursor-pointer ${
                      activeAction === 'dp_audit'
                        ? 'bg-amber-50 border-amber-400 text-amber-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>تدقيق محلي بالمديرية (DP)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">تأكيد اكتمال الوثائق الـ 6</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAction('transmit')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-right transition-colors cursor-pointer ${
                      activeAction === 'transmit'
                        ? 'bg-blue-50 border-blue-400 text-blue-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      <span>قفل الملف وإرساله لـ AREF</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">إصدار جدول إرسال رسمي</div>
                  </button>
                </>
              )}

              {/* AREF Validator Actions */}
              {(currentUser.role === 'aref_validator' || currentUser.role === 'dev') && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveAction('validator_approve')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-right transition-colors cursor-pointer ${
                      activeAction === 'validator_approve'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>موافقة مبدئية لمدقق AREF</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">إحالة على السيد المدير للمصادقة</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAction('validator_return')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-right transition-colors cursor-pointer ${
                      activeAction === 'validator_return'
                        ? 'bg-amber-50 border-amber-400 text-amber-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>إرجاع للمديرية للتصحيح</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">إبداء ملاحظات وتصحيحات</div>
                  </button>
                </>
              )}

              {/* AREF Director Action */}
              {(currentUser.role === 'aref_director' || currentUser.role === 'dev') && (
                <button
                  type="button"
                  onClick={() => setActiveAction('approve')}
                  className={`p-3 rounded-lg border text-xs font-semibold text-right transition-colors cursor-pointer ${
                    activeAction === 'approve'
                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-amber-700" />
                    <span>المصادقة والتوقيع النهائي</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">إصدار مقرر الإسناد الرسمي (PDF)</div>
                </button>
              )}
            </div>

            {/* Inputs based on selected action */}
            {activeAction === 'transmit' && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs space-y-2">
                <label className="block font-semibold text-blue-950">
                  رقم جدول الإرسال الرسمي الصادر عن المديرية الإقليمية (Bordereau d'Envoi DP ➔ AREF):
                </label>
                <input
                  type="text"
                  value={bordereauNum}
                  onChange={(e) => setBordereauNum(e.target.value)}
                  className="w-full p-2 bg-white border border-blue-200 rounded font-mono"
                  placeholder="BORD/2026/..."
                />
              </div>
            )}

            {activeAction === 'approve' && (
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs space-y-2">
                <label className="block font-semibold text-amber-950">
                  رقم مقرر الترخيص بالاستفادة الصادر عن السيد مدير الأكاديمية (Décision d'Attribution AREF):
                </label>
                <input
                  type="text"
                  value={decisionNum}
                  onChange={(e) => setDecisionNum(e.target.value)}
                  className="w-full p-2 bg-white border border-amber-200 rounded font-mono"
                  placeholder="DEC/AREF-OR/2026/..."
                />
              </div>
            )}

            {/* General Comment / Notes Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                ملاحظات وتوجيهات الإدارة / تعليل القرار الإداري:
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="أدخل ملاحظات التدقيق أو شروط الاستفادة أو ملاحظات التصحيح..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Audit History Log */}
          {dossier.auditHistory && dossier.auditHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">سجل الإجراءات والتدقيق السابق على هذا الملف:</div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 p-2.5 rounded-lg bg-slate-50/50">
                {dossier.auditHistory.map((item, i) => (
                  <div key={i} className="text-[11px] bg-white p-2 rounded border border-slate-100 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-800">{item.decision}</div>
                      <div className="text-slate-500">{item.comment}</div>
                    </div>
                    <div className="text-left text-[10px] text-slate-400 shrink-0 font-mono">
                      {item.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleReject}
            type="button"
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            رفض الملف (عدم الاستيفاء)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              إلغاء
            </button>

            {activeAction === 'dp_audit' && (
              <button
                onClick={handleValidateDP}
                type="button"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                تأكيد تدقيق المديرية (DP)
              </button>
            )}

            {activeAction === 'transmit' && (
              <button
                onClick={handleTransmitAREF}
                type="button"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                قفل الملف وإرساله لـ AREF
              </button>
            )}

            {activeAction === 'validator_approve' && (
              <button
                onClick={handleValidatorApprove}
                type="button"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                تأكيد الموافقة المبدئية
              </button>
            )}

            {activeAction === 'validator_return' && (
              <button
                onClick={handleValidatorReturn}
                type="button"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                إرجاع الملف للمديرية مع الملاحظات
              </button>
            )}

            {activeAction === 'approve' && (
              <button
                onClick={handleApproveAREF}
                type="button"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                المصادقة والتوقيع النهائي لقرار الإسناد
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

