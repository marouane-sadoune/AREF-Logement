<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class EvictionProcedure extends Model
{
    protected $table = 'eviction_procedures';

    protected $guarded = ['id'];

    protected $casts = [
        'trigger_date' => 'date',
        'deadline_date' => 'date',
        'notice_sent_date' => 'date',
        'vacate_date' => 'date',
        'deadline_extended' => 'boolean',
        'rent_amount' => 'decimal:2',
    ];

    // الأجل القانوني بالأشهر لكل حالة موجبة للإفراغ (المذكرة 40 - المحور 4).
    public const DEADLINE_MONTHS = [
        'cessation_travail' => 2,          // الانقطاع عن العمل: شهران
        'retraite' => 2,                   // التقاعد: شهران قابلان للتمديد إلى تسلم المعاش
        'fin_mission' => 0,                // إنهاء المهام: بمجرد انتهائها
        'occupation_non_personnelle' => 0, // شغل غير شخصي: فوري وبدون أجل
        'logement_personnel' => 12,        // التوفر على مسكن شخصي: سنة واحدة
    ];

    protected static function booted(): void
    {
        static::saving(function (self $procedure) {
            $caseType = $procedure->case_type;
            $months = self::DEADLINE_MONTHS[$caseType] ?? 2;
            $procedure->deadline_months = $months;

            // حالة التقاعد الممددة: لا أجل محدد ما دام المعني لم يتسلم معاشه.
            if ($caseType === 'retraite' && $procedure->deadline_extended) {
                $procedure->deadline_date = null;

                return;
            }

            if ($procedure->trigger_date) {
                $procedure->deadline_date = Carbon::parse($procedure->trigger_date)
                    ->addMonths($months)
                    ->toDateString();
            }
        });
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(DemandeLogement::class, 'numero_dossier', 'numero_dossier');
    }
}
