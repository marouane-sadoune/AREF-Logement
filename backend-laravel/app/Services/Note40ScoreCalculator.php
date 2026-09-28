<?php

namespace App\Services;

use App\Models\Employee;

class Note40ScoreCalculator
{
    /**
     * احتساب مجموع النقط وفق المعايير الرسمية للمذكرة الوزارية رقم 40
     */
    public function calculate(Employee $employee, int $seniorityInEtablissementYears = 0): array
    {
        // 1. الأقدمية العامة (نقطتان عن كل سنة عمل)
        $yearsGeneral = $employee->recruitment_date ? now()->diffInYears($employee->recruitment_date) : 5;
        $seniorityGeneralPoints = $yearsGeneral * 2;

        // 2. الأقدمية بالمؤسسة (نقطة واحدة عن كل سنة بالمؤسسة)
        $seniorityEtablissementPoints = $seniorityInEtablissementYears * 1;

        // 3. الوضعية العائلية
        $maritalPoints = 0;
        if ($employee->marital_status === 'marie') {
            $maritalPoints += 3;
        } elseif (in_array($employee->marital_status, ['veuf', 'divorce'])) {
            $maritalPoints += 2;
        }

        // نقط الأبناء تحت الكفالة (نقطتان لكل طفل)
        $childrenPoints = min($employee->children_count * 2, 12);
        $familyPoints = $maritalPoints + $childrenPoints;

        // 4. الإطار والمهام الإدارية (Grade / Job)
        $gradePoints = match (strtolower($employee->current_job)) {
            'مدير ثانوية تأهيلية', 'مدير ثانوية إعدادية', 'مدير مدرسة ابتدائية' => 20,
            'ناظر دروس', 'حارس عام للخارجية', 'حارس عام للداخلية' => 15,
            'مسير المصالح المادية والمالية', 'ملحق تربوي' => 10,
            default => 5,
        };

        $totalScore = $seniorityGeneralPoints + $seniorityEtablissementPoints + $familyPoints + $gradePoints;

        return [
            'seniority_general_points' => $seniorityGeneralPoints,
            'seniority_etablissement_points' => $seniorityEtablissementPoints,
            'family_points' => $familyPoints,
            'grade_points' => $gradePoints,
            'total_score' => $totalScore,
        ];
    }
}
