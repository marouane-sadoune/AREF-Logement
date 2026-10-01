<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents_fournis', function (Blueprint $table) {
            $table->string('demande_manuscrite_path')->nullable()->after('demande_manuscrite');
            $table->string('copie_cin_path')->nullable()->after('copie_cin');
            $table->string('attestation_travail_path')->nullable()->after('attestation_travail');
            $table->string('situation_familiale_path')->nullable()->after('situation_familiale');
            $table->string('engagement_honneur_path')->nullable()->after('engagement_honneur');
            $table->string('pv_installation_path')->nullable()->after('pv_installation');
        });
    }

    public function down(): void
    {
        Schema::table('documents_fournis', function (Blueprint $table) {
            $table->dropColumn([
                'demande_manuscrite_path',
                'copie_cin_path',
                'attestation_travail_path',
                'situation_familiale_path',
                'engagement_honneur_path',
                'pv_installation_path',
            ]);
        });
    }
};
