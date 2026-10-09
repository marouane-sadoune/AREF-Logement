<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Eviction procedures (المحور 4 من المذكرة 40: إفراغ المساكن).
|--------------------------------------------------------------------------
| Tracks, per occupied dossier, the legal case that triggers eviction, the
| statutory deadline (2 months / 1 year / immediate), and the follow-up
| procedure when the occupant refuses to vacate (real rent, disciplinary,
| or judicial).
*/

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eviction_procedures', function (Blueprint $table) {
            $table->id();
            $table->string('numero_dossier', 50);
            $table->foreign('numero_dossier')->references('numero_dossier')->on('demandes_logement')->cascadeOnDelete();

            // الحالة الموجبة للإفراغ (المذكرة 40 - المحور 4)
            $table->enum('case_type', [
                'cessation_travail',          // الانقطاع عن العمل (أجل شهران)
                'retraite',                   // الإحالة على التقاعد (يمدد إلى تسلم المعاش)
                'fin_mission',                // إنهاء المهام التي من أجلها أسند السكن
                'occupation_non_personnelle', // عدم شغل السكن بصفة شخصية وفعلية (فوري)
                'logement_personnel',         // المسكن بالفعل توفر على مسكن شخصي (أجل سنة)
            ]);

            $table->date('trigger_date');            // تاريخ الانقطاع / الحدث الموجب
            $table->unsignedTinyInteger('deadline_months')->default(2); // 0 = فوري
            $table->date('deadline_date')->nullable(); // الأجل الأقصى للإفراغ
            $table->boolean('deadline_extended')->default(false); // تمديد التقاعد / الإجازة

            // وضعية المسطرة
            $table->enum('status', [
                'notified',     // تم إشعار المعني بالأمر
                'vacated',      // تم الإفراغ
                'refused',      // امتناع عن الإفراغ
                'rent_applied', // فرض سومة كرائية حقيقية
                'disciplinary', // متابعة تأديبية
                'judicial',     // متابعة قضائية
            ])->default('notified');

            $table->date('notice_sent_date')->nullable();   // تاريخ إشعار الإفراغ
            $table->date('vacate_date')->nullable();        // تاريخ الإفراغ الفعلي
            $table->decimal('rent_amount', 10, 2)->nullable(); // السومة الكرائية المحددة
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eviction_procedures');
    }
};
