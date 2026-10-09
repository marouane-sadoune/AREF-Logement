<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Note 40 المسجل المركزي للمساكن — canonical housing inventory per DP.
 * Dossiers currently carry free-text housing data; this table becomes the
 * single source of truth that dossiers will reference via FK in a future step.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('registre_logements')) return;

        Schema::create('registre_logements', function (Blueprint $table) {
            $table->id();
            $table->string('numero_logement', 50)->unique();
            $table->string('etablissement', 150);
            $table->string('direction_provinciale', 150);
            $table->enum('type_logement', ['fonction', 'administratif']);
            $table->string('categorie', 100);
            $table->text('adresse')->nullable();
            $table->unsignedSmallInteger('nombre_pieces')->default(0);
            $table->unsignedSmallInteger('capacite_personnes')->default(0);
            $table->enum('statut', ['vacant', 'occupe', 'en_maintenance', 'reserve', 'desaffecte'])->default('vacant');
            $table->string('occupant_ppr', 20)->nullable();
            $table->date('date_attribution')->nullable();
            $table->date('date_liberation')->nullable();
            $table->string('motif_vacance', 150)->nullable();
            $table->enum('etat_batiment', ['bon', 'moyen', 'mauvais', 'ruine'])->default('bon');
            $table->text('observations')->nullable();
            $table->timestamps();

            $table->index('direction_provinciale');
            $table->index('etablissement');
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registre_logements');
    }
};
