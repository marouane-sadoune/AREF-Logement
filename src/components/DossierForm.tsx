import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  User, 
  Users, 
  Home, 
  FileCheck, 
  Calculator, 
  CheckCircle, 
  AlertCircle,
  Building,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  HousingDossier, 
  CandidateInfo, 
  SituationFamilialeInfo, 
  HousingRequestInfo,
  RequiredDocumentsChecklist,
  MOROCCAN_AREFS,
  MOROCCAN_DIRECTORATES,
  MOROCCAN_GRADES
} from '../types/housing';
import { calculateBareme } from '../utils/bareme';
import { useAuth } from '../context/AuthContext';
import { getDossierDocumentUrl } from '../api/client';

interface DossierFormProps {
  initialDossier?: HousingDossier | null;
  onSave: (dossier: HousingDossier, docFiles?: Partial<Record<keyof RequiredDocumentsChecklist, File>>) => void;
  onCancel: () => void;
}

export const DossierForm: React.FC<DossierFormProps> = ({
  initialDossier,
  onSave,
  onCancel
}) => {
  const { currentUser } = useAuth();
  const isDpAgent = currentUser.role === 'dp_agent';

  const [activeStep, setActiveStep] = useState<number>(1);

  // Candidate State
  const [candidate, setCandidate] = useState<CandidateInfo>(
    initialDossier?.candidate || {
      fullNameAr: '',
      fullNameFr: '',
      cin: '',
      ppr: '',
      phone: '',
      email: '',
      grade: 'أستاذ التعليم الثانوي التأهيلي',
      scale: 11,
      echelon: 5,
      seniorityGeneral: 10,
      seniorityEtablissement: 3,
      installationDate: '2023-09-01',
      currentEtablissement: '',
      etablissementType: 'ثانوي تأهيلي',
      commune: isDpAgent && currentUser.dpNameAr ? currentUser.dpNameAr.replace('المديرية الإقليمية ب', '').replace(' (بوعرفة)', '').trim() : 'وجدة',
      directionProvinciale: (isDpAgent && currentUser.dpNameAr) ? currentUser.dpNameAr : MOROCCAN_DIRECTORATES[0],
      aref: MOROCCAN_AREFS[0] // الأكاديمية الجهوية للتربية والتكوين - جهة الشرق
    }
  );

  // Situation Familiale State
  const [situationFamiliale, setSituationFamiliale] = useState<SituationFamilialeInfo>(
    initialDossier?.situationFamiliale || {
      maritalStatus: 'marie',
      spouseName: '',
      spouseIsPublicOfficial: false,
      spouseAdministration: '',
      spousePPR: '',
      childrenCount: 2
    }
  );

  // Housing Request State
  const [housingRequest, setHousingRequest] = useState<HousingRequestInfo>(
    initialDossier?.housingRequest || {
      housingType: 'fonction',
      targetEtablissement: '',
      housingCategory: 'شقة وظيفية',
      housingAddress: 'داخل الحرم المدرسي',
      housingNumber: 'شقة 01',
      housingStatus: 'vacant',
      reasons: 'ضرورة التواجد الدائم وحسن سير المرفق الإداري والتربوي وفق المذكرة 40'
    }
  );

  // Documents Checklist State
  const [documents, setDocuments] = useState(
    initialDossier?.documents || {
      demandeManuscrite: { present: true, isLegalized: false },
      copieCIN: { present: true, isLegalized: true },
      attestationTravail: { present: true },
      situationFamiliale: { present: true, marriageCert: true, spouseAttestation: false, childrenCertificates: true },
      engagementHonneur: { present: true, isLegalized: true },
      pvInstallation: { present: true }
    }
  );

  // Auto calculate bareme
  const bareme = calculateBareme(candidate, situationFamiliale, housingRequest);

  // Files staged for the 6 mandatory supporting documents (step 4). They are
  // uploaded to the backend once the dossier itself has been saved -- a new
  // dossier only gets a real id at that point -- so the DP agent can inspect
  // them afterwards (view link next to each document).
  const [docFiles, setDocFiles] = useState<Partial<Record<keyof RequiredDocumentsChecklist, File>>>({});

  const handleDocFileChange = (key: keyof RequiredDocumentsChecklist, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [key]: file || undefined }));
    if (file) {
      setDocuments(prev => ({
        ...prev,
        [key]: { ...(prev[key] as any), present: true, fileName: file.name }
      } as RequiredDocumentsChecklist));
    }
  };

  // File input + inspect link for one of the 6 mandatory documents.
  // Only dossiers that already have a real backend id (editing an existing
  // dossier) can be inspected immediately; a brand new dossier is not saved
  // to the server until the final submit, so newly staged files only show
  // their local file name until then.
  const renderDocFileControl = (key: keyof RequiredDocumentsChecklist) => {
    const staged = docFiles[key];
    const uploadedName = (documents[key] as { fileName?: string }).fileName;

    return (
      <div className="flex flex-col items-end gap-1 shrink-0 w-36">
        <input
          type="checkbox"
          checked={documents[key].present}
          onChange={(e) => setDocuments({
            ...documents,
            [key]: { ...(documents[key] as any), present: e.target.checked }
          } as RequiredDocumentsChecklist)}
          className="w-4 h-4 rounded text-emerald-600 cursor-pointer self-end"
        />
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleDocFileChange(key, e.target.files?.[0] || null)}
          className="w-full text-[10px] text-slate-500 cursor-pointer file:mr-1 file:px-1.5 file:py-0.5 file:rounded file:border-0 file:bg-slate-200 file:text-slate-700 file:text-[10px] file:cursor-pointer"
        />
        {staged && (
          <span className="text-[10px] text-emerald-700 truncate w-full text-left" title={staged.name}>{staged.name}</span>
        )}
        {!staged && uploadedName && initialDossier?.id && (
          <a
            href={getDossierDocumentUrl(initialDossier.id, key)}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-sky-600 underline"
          >
            معاينة الملف
          </a>
        )}
      </div>
    );
  };

  // The requested housing must be located in the candidate's workplace.
  useEffect(() => {
    if (housingRequest.targetEtablissement !== candidate.currentEtablissement) {
      setHousingRequest(prev => ({ ...prev, targetEtablissement: candidate.currentEtablissement }));
    }
  }, [candidate.currentEtablissement, housingRequest.targetEtablissement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidate.fullNameAr.trim() || !candidate.cin.trim() || !candidate.ppr.trim()) {
      alert('يرجى ملء الحقول الإلزامية: الاسم الكامل، رقم البطاقة الوطنية (CIN)، ورقم التأجير (PPR)');
      setActiveStep(1);
      return;
    }

    if (!candidate.currentEtablissement.trim()) {
      alert('يرجى تحديد مقر العمل الحالي (المؤسسة التعليمية)');
      setActiveStep(1);
      return;
    }

    if (housingRequest.targetEtablissement.trim() !== candidate.currentEtablissement.trim()) {
      alert('يجب أن يكون السكن المطلوب داخل نفس المؤسسة التي يعمل بها الموظف');
      setActiveStep(3);
      return;
    }

    const newId = initialDossier ? initialDossier.id : `dos-${Date.now()}`;
    const refNum = initialDossier 
      ? initialDossier.referenceNumber 
      : `DP-LOG/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;

    const savedDossier: HousingDossier = {
      id: newId,
      referenceNumber: refNum,
      creationDate: initialDossier ? initialDossier.creationDate : new Date().toISOString().split('T')[0],
      status: initialDossier ? initialDossier.status : 'submitted_dp',
      candidate,
      situationFamiliale,
      housingRequest,
      documents,
      bareme,
      auditHistory: initialDossier ? initialDossier.auditHistory : [
        {
          stage: 'creation',
          date: new Date().toLocaleString('ar-MA'),
          actor: candidate.fullNameAr,
          decision: 'إيداع الملف بالمديرية الإقليمية',
          comment: 'تم إعداد وتدقيق ملف الترشيح وتضمين الوثائق القانونية طبقاً للمذكرة 40'
        }
      ],
      dpAudit: initialDossier?.dpAudit || {
        auditedBy: 'مكتب السكنيات - DP',
        auditDate: new Date().toISOString().split('T')[0],
        isComplete: Object.values(documents).every(d => d.present),
        bordereauNumber: `BORD/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`
      }
    };

    onSave(savedDossier, docFiles);
  };

  const steps = [
    { number: 1, label: 'معلومات المترشح', icon: User },
    { number: 2, label: 'الوضع العائلي', icon: Users },
    { number: 3, label: 'السكن المطلوب', icon: Home },
    { number: 4, label: 'الوثائق الست المطلوبة', icon: FileCheck },
    { number: 5, label: 'احتساب شبكة التنقيط', icon: Calculator }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Form Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-emerald-600 px-2 py-0.5 rounded text-white">
              المذكرة الوزارية رقم 40
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300">مسطرة إعداد ملف الترشيح للاستفادة</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {initialDossier ? 'تعديل بيانات ملف الترشيح' : 'تكوين ملف طلب جديد للاستفادة من السكن'}
          </h2>
        </div>

        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Indicators */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.number;
            const isCompleted = activeStep > step.number;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(step.number)}
                className={`flex items-center gap-2 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.number}. {step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* STEP 1: معلومات المترشح */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>1. البيانات الشخصية والإدارية للموظف(ة)</span>
              </h3>
              <span className="text-xs text-slate-500">* الحقول إلزامية للتدقيق الإداري</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الاسم والنسب بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ذ. عبد السلام بنجلون"
                  value={candidate.fullNameAr}
                  onChange={(e) => setCandidate({ ...candidate, fullNameAr: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom et Prénom (بالفرنسية)</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="Ex: Abdessalam BENJELLOUN"
                  value={candidate.fullNameFr}
                  onChange={(e) => setCandidate({ ...candidate, fullNameFr: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-left"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم بطاقة التعريف الوطنية (CIN) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: AA12345"
                  value={candidate.cin}
                  onChange={(e) => setCandidate({ ...candidate, cin: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم التأجير (PPR / Somme de paiement) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 1459021"
                  value={candidate.ppr}
                  onChange={(e) => setCandidate({ ...candidate, ppr: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الإطار / المهمة الإدارية *</label>
                <select
                  value={candidate.grade}
                  onChange={(e) => setCandidate({ ...candidate, grade: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {MOROCCAN_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">السلم الإداري</label>
                  <select
                    value={candidate.scale}
                    onChange={(e) => setCandidate({ ...candidate, scale: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  >
                    <option value={9}>السلم 9</option>
                    <option value={10}>السلم 10</option>
                    <option value={11}>السلم 11</option>
                    <option value={12}>خارج السلم (Hors échelle)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرتبة</label>
                  <input
                    type="number"
                    min={1}
                    max={13}
                    value={candidate.echelon}
                    onChange={(e) => setCandidate({ ...candidate, echelon: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الأقدمية العامة بالتعليم (سنوات)</label>
                <input
                  type="number"
                  min={0}
                  max={45}
                  value={candidate.seniorityGeneral}
                  onChange={(e) => setCandidate({ ...candidate, seniorityGeneral: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">تمنح 1 نقطة عن كل سنة في شبكة التنقيط</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الأقدمية في المؤسسة الحالية (سنوات)</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={candidate.seniorityEtablissement}
                  onChange={(e) => setCandidate({ ...candidate, seniorityEtablissement: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">تمنح 2 نقط عن كل سنة استقرار بالمؤسسة</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">مقر العمل الحالي (المؤسسة التعليمية) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الثانوية التأهيلية ابن عباد"
                  value={candidate.currentEtablissement}
                  onChange={(e) => setCandidate({ ...candidate, currentEtablissement: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">المديرية الإقليمية (DP) *</label>
                  {isDpAgent && currentUser.dpNameAr && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded">
                      حساب المديرية: {currentUser.dpNameAr}
                    </span>
                  )}
                </div>
                <select
                  value={candidate.directionProvinciale}
                  onChange={(e) => setCandidate({ ...candidate, directionProvinciale: e.target.value })}
                  disabled={isDpAgent && !!currentUser.dpNameAr}
                  className={`w-full p-2.5 border rounded-lg focus:outline-none ${
                    isDpAgent && currentUser.dpNameAr
                      ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-bold cursor-not-allowed'
                      : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white'
                  }`}
                >
                  {MOROCCAN_DIRECTORATES.map((dp) => (
                    <option key={dp} value={dp}>{dp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الأكاديمية الجهوية (AREF) *</label>
                <select
                  value={candidate.aref}
                  onChange={(e) => setCandidate({ ...candidate, aref: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {MOROCCAN_AREFS.map((ar) => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="0661xxxxxx"
                    value={candidate.phone}
                    onChange={(e) => setCandidate({ ...candidate, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني المهني</label>
                  <input
                    type="email"
                    placeholder="@taalim.ma"
                    value={candidate.email}
                    onChange={(e) => setCandidate({ ...candidate, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: الوضع العائلي */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>2. الوضع العائلي (Situation Familiale) والوثائق المثبتة</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                حسب المذكرة 40، يمنح المتزوج 4 نقط، ويمنح نقطتان عن كل طفل معال في حدود 4 أطفال.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">الحالة العائلية للمترشح(ة)</label>
                <select
                  value={situationFamiliale.maritalStatus}
                  onChange={(e) => setSituationFamiliale({ ...situationFamiliale, maritalStatus: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="marie">متزوج(ة) - 4 نقط</option>
                  <option value="celibataire">عازب(ة) - 1 نقطة</option>
                  <option value="divorce">مطلق(ة) بحضانة / بدون حضانة</option>
                  <option value="veuf">أرمل(ة)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">عدد الأطفال المعالين (تحت سن الرشد)</label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={situationFamiliale.childrenCount}
                  onChange={(e) => setSituationFamiliale({ ...situationFamiliale, childrenCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">نقطتان عن كل طفل (أقصاه 8 نقط)</span>
              </div>

              {situationFamiliale.maritalStatus === 'marie' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اسم ونسب الزوج(ة)</label>
                    <input
                      type="text"
                      placeholder="الاسم الكامل للزوج أو الزوجة"
                      value={situationFamiliale.spouseName}
                      onChange={(e) => setSituationFamiliale({ ...situationFamiliale, spouseName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-slate-700">هل الزوج(ة) موظف(ة) عمومي(ة)؟</label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="spouseOfficial"
                          checked={situationFamiliale.spouseIsPublicOfficial}
                          onChange={() => setSituationFamiliale({ ...situationFamiliale, spouseIsPublicOfficial: true })}
                        />
                        <span>نعم (موظف بالقطاع العام)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="spouseOfficial"
                          checked={!situationFamiliale.spouseIsPublicOfficial}
                          onChange={() => setSituationFamiliale({ ...situationFamiliale, spouseIsPublicOfficial: false })}
                        />
                        <span>لا (قطاع خاص / لا يعمل)</span>
                      </label>
                    </div>
                  </div>

                  {situationFamiliale.spouseIsPublicOfficial && (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">الإدارة المشغلة للزوج(ة)</label>
                        <input
                          type="text"
                          placeholder="مثال: وزارة التربية الوطنية أو وزارة الصحة"
                          value={situationFamiliale.spouseAdministration}
                          onChange={(e) => setSituationFamiliale({ ...situationFamiliale, spouseAdministration: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">رقم تأجير الزوج(ة) (PPR)</label>
                        <input
                          type="text"
                          placeholder="رقم التأجير إن وجد"
                          value={situationFamiliale.spousePPR}
                          onChange={(e) => setSituationFamiliale({ ...situationFamiliale, spousePPR: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: مواصفات السكن المطلوب */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>3. مواصفات السكن الإداري أو الوظيفي المطلوب</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تحديد طبيعة السكن طبقاً للمذكرة 40 (وظيفي بحكم ضرورة المهام أم إداري حسب الاستحقاق).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع السكن *</label>
                <select
                  value={housingRequest.housingType}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingType: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                >
                  <option value="fonction">سكن وظيفي (Logement de fonction - بحكم المسؤولية والمهام)</option>
                  <option value="administratif">سكن إداري (Logement administratif - حسب شبكة التنقيط)</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  {housingRequest.housingType === 'fonction'
                    ? 'يخصص للمدير، الحراس العامين، النظار، والمقتصدين لضرورة المصلحة المطلقة.'
                    : 'يمنح لباقي الأطر التعليمية والإدارية بناءً على التنافس وشبكة التنقيط.'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المؤسسة التعليمية التي يوجد بها السكن *</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={housingRequest.targetEtablissement}
                  className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-semibold cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500">يجب أن يطابق مقر العمل الحالي للموظف.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">صنف ونوع السكن</label>
                <input
                  type="text"
                  placeholder="مثال: فيلا وظيفية، شقة ملحقة، جناح إداري"
                  value={housingRequest.housingCategory}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingCategory: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم السكن أو رمزه الإداري</label>
                <input
                  type="text"
                  placeholder="مثال: سكن رقم 01، جناح A"
                  value={housingRequest.housingNumber}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">موقع وعنوان السكن بدقة</label>
                <input
                  type="text"
                  placeholder="مثال: داخل المؤسسة التعليمية، الجناح الإداري، قرب الباب الرئيسي"
                  value={housingRequest.housingAddress}
                  onChange={(e) => setHousingRequest({ ...housingRequest, housingAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">دواعي وأسباب الطلب</label>
                <textarea
                  rows={3}
                  value={housingRequest.reasons}
                  onChange={(e) => setHousingRequest({ ...housingRequest, reasons: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: التحقق من الوثائق الـ 6 الإلزامية */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>4. التحقق من الوثائق الست الإلزامية المكونة للملف (Dossier de Demande)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                هذه الوثائق تدقق بمصلحة الموارد البشرية بالمديرية الإقليمية (DP) قبل الإحالة على الأكاديمية الجهوية (AREF).
              </p>
            </div>

            <div className="space-y-3">
              {/* Doc 1 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">1. الطلب الخطي (Demande manuscrite)</div>
                  <div className="text-slate-500 text-[11px]">
                    طلب موجه إلى السيد المدير الإقليمي، يحدد فيه الموظف رغبته مع ذكر إطاره، مهامه، ومقر عمله.
                  </div>
                </div>
                {renderDocFileControl('demandeManuscrite')}
              </div>

              {/* Doc 2 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">2. نسخة من بطاقة التعريف الوطنية (Copie de la CIN)</div>
                  <div className="text-slate-500 text-[11px]">
                    بطاقة التعريف الوطنية الإلكترونية للمستفيد سارية الصلاحية.
                  </div>
                </div>
                {renderDocFileControl('copieCIN')}
              </div>

              {/* Doc 3 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">3. شهادة العمل (Attestation de travail) حديثة</div>
                  <div className="text-slate-500 text-[11px]">
                    تثبت وضعية الموظف الإدارية، إطاره، سلمه، وتاريخ تعيينه بمقر العمل.
                  </div>
                </div>
                {renderDocFileControl('attestationTravail')}
              </div>

              {/* Doc 4 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">4. الوضع العائلي (Situation Familiale)</div>
                  <div className="text-slate-500 text-[11px]">
                    عقد الزواج + شهادة إدارية تثبت عمل الزوج(ة) (إن كان موظفاً) + بيان عدد الأطفال المعالين (عقود ازدياد).
                  </div>
                </div>
                {renderDocFileControl('situationFamiliale')}
              </div>

              {/* Doc 5 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">5. مطبوع الالتزام والتصريح بالشرف (Engagement)</div>
                  <div className="text-slate-500 text-[11px]">
                    التزام مصحح الإمضاء يقر فيه باحترام بنود المذكرة 40 والتعهد بإفراغ السكن فور انتهاء المهام.
                  </div>
                </div>
                {renderDocFileControl('engagementHonneur')}
              </div>

              {/* Doc 6 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">6. محضر الالتحاق بالمؤسسة (PV d'installation)</div>
                  <div className="text-slate-500 text-[11px]">
                    يثبت تعيين الموظف الفعلي بالمؤسسة التعليمية التي يوجد بها السكن المطلوب.
                  </div>
                </div>
                {renderDocFileControl('pvInstallation')}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: احتساب شبكة التنقيط */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>5. شبكة التنقيط المعيارية للمترشح (Calcul du Barème)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                محسوبة تلقائياً وفق المعايير الإدارية المنصوص عليها في المذكرة الوزارية 40.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الأقدمية العامة</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.seniorityGeneralPts}</div>
                  <div className="text-[10px] text-slate-400">1 نقطة / سنة</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الأقدمية بالمؤسسة</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.seniorityEtablissementPts}</div>
                  <div className="text-[10px] text-slate-400">2 نقط / سنة</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">السلم الإداري ({candidate.scale})</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.scalePts}</div>
                  <div className="text-[10px] text-slate-400">حسب درجة الإطار</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">الوضع العائلي والأبناء</div>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-1">{bareme.maritalPts + bareme.childrenPts}</div>
                  <div className="text-[10px] text-slate-400">{bareme.maritalPts} زواج + {bareme.childrenPts} أبناء</div>
                </div>
              </div>

              {housingRequest.housingType === 'fonction' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between text-xs text-amber-900">
                  <div>
                    <strong>امتياز المسؤولية الإدارية (سكن وظيفي):</strong>{' '}
                    <span>أسبقية إدارية ملزمة بحكم مزاولة مهام الإدارة التربوية والتدبير المالي</span>
                  </div>
                  <div className="text-base font-mono font-bold text-emerald-800">
                    +{bareme.responsibilityBonus} نقطة
                  </div>
                </div>
              )}

              <div className="bg-emerald-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-200 font-medium">المجموع الإجمالي لنقط الاستحقاق</div>
                  <div className="text-sm font-bold mt-0.5">الملف جاهز للإحالة على اللجنة المختصة</div>
                </div>
                <div className="text-3xl font-mono font-bold text-emerald-300">
                  {bareme.totalPts} <span className="text-sm font-normal text-emerald-100">نقطة</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Submit Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                السابق
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
            >
              إلغاء
            </button>

            {activeStep < 5 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                المتابعة إلى الخطوة {activeStep + 1}
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتسجيل ملف الترشيح</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
