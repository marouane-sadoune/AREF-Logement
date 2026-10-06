<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents_fournis', function (Blueprint $table) {
            $table->string('situation_familiale_contrat_mariage_path')->nullable()->after('situation_familiale_path');
            $table->string('situation_familiale_attestation_conjoint_path')->nullable()->after('situation_familiale_contrat_mariage_path');
            $table->string('situation_familiale_enfants_path')->nullable()->after('situation_familiale_attestation_conjoint_path');
        });
    }

    public function down(): void
    {
        Schema::table('documents_fournis', function (Blueprint $table) {
            $table->dropColumn([
                'situation_familiale_contrat_mariage_path',
                'situation_familiale_attestation_conjoint_path',
                'situation_familiale_enfants_path',
            ]);
        });
    }
};
