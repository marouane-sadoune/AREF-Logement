import { CandidateInfo, SituationFamilialeInfo, HousingRequestInfo, BaremePoints } from '../types/housing';

export function calculateBareme(
  candidate: Partial<CandidateInfo>,
  family: Partial<SituationFamilialeInfo>,
  housing: Partial<HousingRequestInfo>
): BaremePoints {
  // 1. الأقدمية العامة: نقطة عن كل سنة
  const seniorityGeneral = Number(candidate.seniorityGeneral) || 0;
  const seniorityGeneralPts = Math.min(seniorityGeneral * 1, 30);

  // 2. الأقدمية في المؤسسة الحالية: نقطتان عن كل سنة
  const seniorityEtab = Number(candidate.seniorityEtablissement) || 0;
  const seniorityEtablissementPts = Math.min(seniorityEtab * 2, 20);

  // 3. السلم الإداري
  const scale = Number(candidate.scale) || 10;
  let scalePts = 6;
  if (scale >= 12 || scale === 99) { // 99 for Hors Echelle
    scalePts = 12;
  } else if (scale === 11) {
    scalePts = 10;
  } else if (scale === 10) {
    scalePts = 8;
  } else {
    scalePts = 6;
  }

  // 4. الوضع العائلي
  let maritalPts = 1;
  const status = family.maritalStatus;
  if (status === 'marie') {
    maritalPts = 4;
  } else if (status === 'veuf' || status === 'divorce') {
    maritalPts = family.childrenCount && family.childrenCount > 0 ? 4 : 2;
  } else {
    maritalPts = 1;
  }

  // 5. الأطفال المعالون: نقطتان عن كل طفل (بحد أقصى 4 أطفال = 8 نقط)
  const childrenCount = Number(family.childrenCount) || 0;
  const childrenPts = Math.min(childrenCount * 2, 8);

  // 6. امتياز الوظيفة الإدارية الملزمة للسكن الوظيفي (مدير، حارس عام، ناظر، مقتصد)
  let responsibilityBonus = 0;
  if (housing.housingType === 'fonction') {
    const isExecutive = [
      'مدير ثانوية تأهيلية',
      'مدير ثانوية إعدادية',
      'مدير مدرسة ابتدائية',
      'ناظر الدروس',
      'رئيس أشغال',
      'حارس عام للخارجية',
      'حارس عام للداخلية',
      'مسير المصالح المادية والمالية (مقتصد)'
    ].includes(candidate.grade || '');

    if (isExecutive) {
      responsibilityBonus = 25; // أسبقية وظيفية ملزمة بحكم المذكرة 40
    } else {
      responsibilityBonus = 10;
    }
  }

  const totalPts =
    seniorityGeneralPts +
    seniorityEtablissementPts +
    scalePts +
    maritalPts +
    childrenPts +
    responsibilityBonus;

  return {
    seniorityGeneralPts,
    seniorityEtablissementPts,
    scalePts,
    maritalPts,
    childrenPts,
    responsibilityBonus,
    totalPts
  };
}
