<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links demandes_logement to registre_logements so dossiers reference a
 * canonical housing record instead of carrying free-text housing data.
 * The existing free-text columns are kept for backward compatibility.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('demandes_logement', 'registre_logement_id')) return;

        Schema::table('demandes_logement', function (Blueprint $table) {
            $table->unsignedBigInteger('registre_logement_id')->nullable()->after('candidat_ppr');
            $table->foreign('registre_logement_id')
                  ->references('id')
                  ->on('registre_logements')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('demandes_logement', 'registre_logement_id')) return;

        Schema::table('demandes_logement', function (Blueprint $table) {
            $table->dropForeign(['registre_logement_id']);
            $table->dropColumn('registre_logement_id');
        });
    }
};
