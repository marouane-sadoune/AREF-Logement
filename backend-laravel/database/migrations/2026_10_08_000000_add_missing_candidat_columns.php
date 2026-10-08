<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The pre-existing `candidats` table was created by an older schema
        // and is missing the family-status columns that the API expects.
        Schema::table('candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('candidats', 'date_installation')) {
                $table->date('date_installation')->nullable()->after('anciennete_etablissement');
            }
            if (!Schema::hasColumn('candidats', 'aref')) {
                $table->string('aref')->nullable()->after('direction_provinciale');
            }
            if (!Schema::hasColumn('candidats', 'situation_familiale')) {
                $table->enum('situation_familiale', ['celibataire', 'marie', 'divorce', 'veuf'])->default('celibataire')->after('aref');
            }
            if (!Schema::hasColumn('candidats', 'nom_conjoint')) {
                $table->string('nom_conjoint')->nullable()->after('situation_familiale');
            }
            if (!Schema::hasColumn('candidats', 'conjoint_fonctionnaire')) {
                $table->boolean('conjoint_fonctionnaire')->default(false)->after('nom_conjoint');
            }
            if (!Schema::hasColumn('candidats', 'administration_conjoint')) {
                $table->string('administration_conjoint')->nullable()->after('conjoint_fonctionnaire');
            }
            if (!Schema::hasColumn('candidats', 'ppr_conjoint')) {
                $table->string('ppr_conjoint', 20)->nullable()->after('administration_conjoint');
            }
            if (!Schema::hasColumn('candidats', 'nombre_enfants')) {
                $table->unsignedSmallInteger('nombre_enfants')->default(0)->after('ppr_conjoint');
            }

        });
    }

    public function down(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            $table->dropColumn([
                'date_installation', 'aref', 'situation_familiale', 'nom_conjoint',
                'conjoint_fonctionnaire', 'administration_conjoint', 'ppr_conjoint', 'nombre_enfants',
            ]);
        });
    }
};
