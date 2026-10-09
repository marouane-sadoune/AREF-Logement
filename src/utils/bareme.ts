import {
  CandidateInfo,
  SituationFamilialeInfo,
  HousingRequestInfo,
  BaremePoints,
  PerformanceRating,
} from '../types/housing';

// ====== شبكة التنقيط الرسمية - المذكرة الوزارية رقم 40 ======
// سبعة معايير، كل معيار يُنقّط وفق سلّم رسمي ثابت.
// عند التعادل: تُرجَّح الأقدمية العامة، ثم يُلجأ إلى القرعة.

// 1. الإطار (حسب السلم الإداري)
const SCALE_PTS: Record<string, number> = {
  low: 1,   // السلم 10 وأقل
  mid: 2,   // السلم 11
  high: 3,  // السلم 12 فما فوق وخارج السلم
};

// 6. المردودية (تقييم الرئيس المباشر)
const PERFORMANCE_PTS: Record<PerformanceRating, number> = {
  excellent: 3,    // جيد جدا
  good: 2,         // جيد
  satisfactory: 1, // مستحسن
  below: 0,        // دون المستحسن
};

// 5. المسؤولية الإدارية
const DIRECTOR_GRADES = [
  'مدير ثانوية تأهيلية',
  'مدير ثانوية إعدادية',
  'مدير مدرسة ابتدائية',
];
const SERVICE_CHIEF_GRADES = [
  'ناظر الدروس',
  'رئيس أشغال',
  'حارس عام للخارجية',
  'حارس عام للداخلية',
  'مسير المصالح المادية والمالية (مقتصد)',
  'متصرف تربوي',
];

function scalePoints(scale: number): number {
  const s = Number(scale) || 0;
  if (s >= 12 || s === 99) return SCALE_PTS.high; // 99 = خارج السلم
  if (s === 11) return SCALE_PTS.mid;
  return SCALE_PTS.low;
}

// 2. الأقدمية العامة: سلّم من 5 أشطر
function generalSeniorityPoints(years: number): number {
  const y = Number(years) || 0;
  if (y >= 21) return 5;
  if (y >= 16) return 4;
  if (y >= 11) return 3;
  if (y >= 6) return 2;
  if (y >= 1) return 1;
  return 0;
}

// 3. الأقدمية بنفس المدينة / المؤسسة: شطران
function localitySeniorityPoints(years: number): number {
  const y = Number(years) || 0;
  if (y >= 6) return 2;
  if (y >= 2) return 1;
  return 0;
}

// 5. المسؤولية: رئيس قسم = 3، رئيس مصلحة = 2
function responsibilityPoints(grade: string): number {
  if (DIRECTOR_GRADES.includes(grade)) return 3;
  if (SERVICE_CHIEF_GRADES.includes(grade)) return 2;
  return 0;
}

// 7. الوسط القروي: معلمة غير متزوجة = 3، مدرس بفرعية = 2
function ruralPoints(
  candidate: Partial<CandidateInfo>,
  family: Partial<SituationFamilialeInfo>
): number {
  const branchTeacher = candidate.isRuralBranch === true;
  const unmarriedFemaleRural =
    candidate.isRuralArea === true &&
    candidate.gender === 'female' &&
    family.maritalStatus === 'celibataire';
  // يُمنح الأعلى فقط (لا يُجمع الامتيازان)
  if (unmarriedFemaleRural) return 3;
  if (branchTeacher) return 2;
  return 0;
}

export function calculateBareme(
  candidate: Partial<CandidateInfo>,
  family: Partial<SituationFamilialeInfo>,
  housing: Partial<HousingRequestInfo>
): BaremePoints {
  // 1. الإطار
  const scalePts = scalePoints(Number(candidate.scale));

  // 2. الأقدمية العامة
  const seniorityGeneralPts = generalSeniorityPoints(Number(candidate.seniorityGeneral));

  // 3. الأقدمية بنفس المدينة / المؤسسة
  const seniorityEtablissementPts = localitySeniorityPoints(Number(candidate.seniorityEtablissement));

  // 4. التحملات العائلية
  //    - نقطة عن كل طفل في حدود 3 أطفال
  const childrenCount = Number(family.childrenCount) || 0;
  const childrenPts = Math.min(childrenCount, 3);
  //    - نقطتان عن الزوج/الزوجة غير العاملة
  const spousePts =
    family.maritalStatus === 'marie' && family.spouseIsPublicOfficial === false ? 2 : 0;
  const maritalPts = spousePts;

  // 5. المسؤولية
  const responsibilityBonus = responsibilityPoints(candidate.grade || '');

  // 6. المردودية
  const performancePts = PERFORMANCE_PTS[candidate.performanceRating ?? 'satisfactory'];

  // 7. الوسط القروي
  const ruralBonusPts = ruralPoints(candidate, family);

  const totalPts =
    scalePts +
    seniorityGeneralPts +
    seniorityEtablissementPts +
    maritalPts +
    childrenPts +
    responsibilityBonus +
    performancePts +
    ruralBonusPts;

  // `housing` is part of the official signature (context of the request) but the
  // Note 40 grid does not score it directly; referenced to keep callers stable.
  void housing;

  return {
    seniorityGeneralPts,
    seniorityEtablissementPts,
    scalePts,
    maritalPts,
    childrenPts,
    responsibilityBonus,
    performancePts,
    ruralBonusPts,
    totalPts,
  };
}

/**
 * ترتيب المترشحين وفق المذكرة 40:
 * المجموع تنازليا، ثم الأقدمية العامة تنازليا عند التعادل، ثم القرعة (اسم أبجدي).
 */
export function compareBareme(
  a: { bareme: BaremePoints; candidate: CandidateInfo },
  b: { bareme: BaremePoints; candidate: CandidateInfo }
): number {
  if (b.bareme.totalPts !== a.bareme.totalPts) return b.bareme.totalPts - a.bareme.totalPts;
  const sa = Number(a.candidate.seniorityGeneral) || 0;
  const sb = Number(b.candidate.seniorityGeneral) || 0;
  if (sb !== sa) return sb - sa;
  return a.candidate.fullNameAr.localeCompare(b.candidate.fullNameAr, 'ar');
}
