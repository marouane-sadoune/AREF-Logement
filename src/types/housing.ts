export type MaritalStatus = 'celibataire' | 'marie' | 'divorce' | 'veuf';

export type HousingType = 'fonction' | 'administratif';

export type DossierStatus = 
  | 'draft'              // مسودة
  | 'submitted_dp'        // مودع بالمديرية الإقليمية
  | 'under_review_dp'    // قيد التدقيق بالمديرية الإقليمية
  | 'transmitted_aref'   // محال على الأكاديمية الجهوية
  | 'approved'           // تمت المصادقة ومنح السكن
  | 'rejected';          // مرفوض / غير مستوفي للشروط

export interface RequiredDocumentStatus {
  present: boolean;
  date?: string;
  notes?: string;
  fileName?: string;
  isLegalized?: boolean;
  dateLegalized?: string;
  pvNumber?: string;
  installationDate?: string;
}

export interface SituationFamilialeDocs {
  present: boolean;
  marriageCert: boolean;
  spouseAttestation: boolean;
  childrenCertificates: boolean;
  notes?: string;
  fileName?: string;
}

export interface CandidateInfo {
  fullNameAr: string;
  fullNameFr: string;
  cin: string;
  ppr: string; // Numéro de SOM / رقم التأجير
  phone: string;
  email: string;
  grade: string; // الإطار
  scale: number; // السلم (9, 10, 11, خارج السلم)
  echelon: number; // الرتبة
  seniorityGeneral: number; // الأقدمية العامة (سنوات)
  seniorityEtablissement: number; // الأقدمية بالمؤسسة الحالية (سنوات)
  installationDate: string; // تاريخ التعيين / الالتحاق بالمؤسسة
  currentEtablissement: string; // المؤسسة التعليمية الحالية
  etablissementType: string; // ابتدائي، ثانوي إعدادي، ثانوي تأهيلي، مصلحة إدارية
  commune: string;
  directionProvinciale: string; // المديرية الإقليمية (DP)
  aref: string; // الأكاديمية الجهوية للتربية والتكوين (AREF)
}

export interface SituationFamilialeInfo {
  maritalStatus: MaritalStatus;
  spouseName?: string;
  spouseIsPublicOfficial: boolean;
  spouseAdministration?: string;
  spousePPR?: string;
  childrenCount: number;
}

export interface HousingRequestInfo {
  housingType: HousingType; // وظيفي أو إداري
  targetEtablissement: string;
  housingCategory: string; // شقة، فيلا، سكن ملحق
  housingAddress: string;
  housingNumber?: string;
  housingStatus: 'vacant' | 'occupied_to_evict' | 'under_maintenance';
  reasons: string; // دواعي الطلب
}

export interface RequiredDocumentsChecklist {
  demandeManuscrite: RequiredDocumentStatus;
  copieCIN: RequiredDocumentStatus;
  attestationTravail: RequiredDocumentStatus;
  situationFamiliale: SituationFamilialeDocs;
  engagementHonneur: RequiredDocumentStatus;
  pvInstallation: RequiredDocumentStatus;
}

export interface BaremePoints {
  seniorityGeneralPts: number;
  seniorityEtablissementPts: number;
  scalePts: number;
  maritalPts: number;
  childrenPts: number;
  responsibilityBonus: number;
  totalPts: number;
}

export interface AuditHistoryEntry {
  stage: 'creation' | 'submission_dp' | 'audit_dp' | 'transmission_aref' | 'commission_aref' | 'final_decision';
  date: string;
  actor: string;
  decision: string;
  comment: string;
}

export interface HousingDossier {
  id: string;
  referenceNumber: string;
  creationDate: string;
  status: DossierStatus;
  candidate: CandidateInfo;
  situationFamiliale: SituationFamilialeInfo;
  housingRequest: HousingRequestInfo;
  documents: RequiredDocumentsChecklist;
  bareme: BaremePoints;
  auditHistory: AuditHistoryEntry[];
  dpAudit?: {
    auditedBy?: string;
    auditDate?: string;
    isComplete: boolean;
    dpNotes?: string;
    bordereauNumber?: string;
    transmissionDate?: string;
  };
  arefDecision?: {
    commissionDate?: string;
    commissionDecision?: 'accord' | 'refus' | 'en_attente';
    decisionNumber?: string;
    pvDecisionDate?: string;
    arefNotes?: string;
  };
}

export const MOROCCAN_AREFS = [
  'الأكاديمية الجهوية للتربية والتكوين - جهة الشرق (AREF Oriental)'
];

export interface DirectorateMeta {
  code: string;
  nameAr: string;
  nameFr: string;
  chiefTown: string;
}

export const ORIENTAL_DIRECTORATES: DirectorateMeta[] = [
  { code: 'OUJ', nameAr: 'المديرية الإقليمية بوجدة أنكاد', nameFr: 'Direction Provinciale d\'Oujda-Angad', chiefTown: 'وجدة (Oujda)' },
  { code: 'BRK', nameAr: 'المديرية الإقليمية ببركان', nameFr: 'Direction Provinciale de Berkane', chiefTown: 'بركان (Berkane)' },
  { code: 'NAD', nameAr: 'المديرية الإقليمية بالناظور', nameFr: 'Direction Provinciale de Nador', chiefTown: 'الناظور (Nador)' },
  { code: 'DRI', nameAr: 'المديرية الإقليمية بالدريوش', nameFr: 'Direction Provinciale de Driouch', chiefTown: 'الدريوش (Driouch)' },
  { code: 'TAO', nameAr: 'المديرية الإقليمية بتاوريرت', nameFr: 'Direction Provinciale de Taourirt', chiefTown: 'تاوريرت (Taourirt)' },
  { code: 'GUE', nameAr: 'المديرية الإقليمية بجرسيف', nameFr: 'Direction Provinciale de Guercif', chiefTown: 'جرسيف (Guercif)' },
  { code: 'JER', nameAr: 'المديرية الإقليمية بجرادة', nameFr: 'Direction Provinciale de Jerada', chiefTown: 'جرادة (Jerada)' },
  { code: 'FIG', nameAr: 'المديرية الإقليمية بفكيك (بوعرفة)', nameFr: 'Direction Provinciale de Figuig (Bouarfa)', chiefTown: 'فكيك / بوعرفة (Figuig)' }
];

export const MOROCCAN_DIRECTORATES = ORIENTAL_DIRECTORATES.map(d => d.nameAr);


export const MOROCCAN_GRADES = [
  'مدير ثانوية تأهيلية',
  'مدير ثانوية إعدادية',
  'مدير مدرسة ابتدائية',
  'ناظر الدروس',
  'رئيس أشغال',
  'حارس عام للخارجية',
  'حارس عام للداخلية',
  'مسير المصالح المادية والمالية (مقتصد)',
  'أستاذ التعليم الثانوي التأهيلي',
  'أستاذ التعليم الثانوي الإعدادي',
  'أستاذ التعليم الابتدائي',
  'ملحق تربوي',
  'ملحق الإدارة والاقتصاد',
  'ملحق اجتماعي',
  'مفتش تربوي للتعليم الثانوي',
  'مفتش المصالح المادية والمالية',
  'متصرف تربوي'
];
