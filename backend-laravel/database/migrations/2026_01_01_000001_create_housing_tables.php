<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. المديريات الإقليمية (Directions Provinciales)
        Schema::create('directions_provinciales', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // DP_OUJDA, DP_BERKANE, etc.
            $table->string('name_ar');
            $table->string('name_fr');
            $table->timestamps();
        });

        // 2. الموظفون / المترشحون (Employees)
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('ppr')->unique(); // رقم التأجير
            $table->string('cin')->unique(); // رقم البطاقة الوطنية
            $table->string('full_name_ar');
            $table->string('full_name_fr');
            $table->string('current_job'); // الإطار والصفة
            $table->string('grade');
            $table->string('scale')->nullable(); // السلم
            $table->string('echelon')->nullable(); // الرتبة
            $table->foreignId('direction_provinciale_id')->constrained('directions_provinciales');
            $table->string('current_etablissement'); // مقر العمل الحالي
            $table->string('commune')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->date('birth_date')->nullable();
            $table->date('recruitment_date')->nullable(); // تاريخ التوظيف
            $table->string('marital_status')->default('marie'); // marie, celibataire, etc.
            $table->integer('children_count')->default(0);
            $table->boolean('spouse_is_civil_servant')->default(false); // الزوج موظف
            $table->timestamps();
        });

        // 3. السكنيات الوظيفية والإدارية (Lodgings)
        Schema::create('lodgings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('direction_provinciale_id')->constrained('directions_provinciales');
            $table->string('etablissement_name');
            $table->string('address');
            $table->enum('type', ['fonction', 'necessite_service', 'administratif']); // وظيفي أو إداري
            $table->string('category')->default('villa'); // فيلا، شقة، جناح
            $table->string('occupancy_status')->default('vacant'); // vacant, occupied, maintenance
            $table->integer('rooms_count')->default(3);
            $table->timestamps();
        });

        // 4. طلبات وقرارات الإسناد (Assignments)
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('lodging_id')->constrained('lodgings');
            
            // Workflow Status
            $table->enum('status', [
                'draft',
                'submitted',
                'dp_validated',
                'aref_pv_published',
                'approved',
                'rejected'
            ])->default('submitted');

            // Barème Note 40 Points
            $table->integer('seniority_general_points')->default(0);
            $table->integer('seniority_etablissement_points')->default(0);
            $table->integer('grade_points')->default(0);
            $table->integer('marital_points')->default(0);
            $table->integer('total_score')->default(0);

            // Mails and References
            $table->string('incoming_mail_num')->nullable(); // رقم إرسالية المديرية
            $table->date('incoming_mail_date')->nullable();
            $table->string('decision_number')->nullable(); // رقم قرار الأكاديمية
            $table->date('decision_date')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('lodgings');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('directions_provinciales');
    }
};
