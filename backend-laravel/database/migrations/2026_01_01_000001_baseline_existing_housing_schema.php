<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('directions_provinciales', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('nom_ar');
            $table->string('nom_fr');
            $table->string('chef_lieu')->nullable();
        });

        Schema::create('candidats', function (Blueprint $table) {
            $table->id();
            $table->string('ppr', 20)->unique();
            $table->string('cin', 20)->nullable();
            $table->string('nom_ar');
            $table->string('nom_fr');
            $table->string('telephone', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('cadre');
            $table->unsignedSmallInteger('echelle')->nullable();
            $table->unsignedSmallInteger('echelon')->nullable();
            $table->unsignedSmallInteger('anciennete_generale')->default(0);
            $table->unsignedSmallInteger('anciennete_etablissement')->default(0);
            $table->date('date_installation')->nullable();
            $table->string('etablissement_actuel')->nullable();
            $table->string('type_etablissement')->nullable();
            $table->string('commune')->nullable();
            $table->string('direction_provinciale');
            $table->string('aref')->nullable();
            $table->enum('situation_familiale', ['celibataire', 'marie', 'divorce', 'veuf'])->default('celibataire');
            $table->string('nom_conjoint')->nullable();
            $table->boolean('conjoint_fonctionnaire')->default(false);
            $table->string('administration_conjoint')->nullable();
            $table->string('ppr_conjoint', 20)->nullable();
            $table->unsignedSmallInteger('nombre_enfants')->default(0);
        });

        Schema::create('demandes_logement', function (Blueprint $table) {
            $table->id();
            $table->string('numero_dossier', 50)->unique();
            $table->string('candidat_ppr', 20);
            $table->foreign('candidat_ppr')->references('ppr')->on('candidats');
            $table->enum('type_logement', ['fonction', 'administratif']);
            $table->string('etablissement_cible', 150);
            $table->string('categorie_logement', 100)->nullable();
            $table->text('adresse_logement')->nullable();
            $table->string('numero_logement', 50)->nullable();
            $table->enum('statut_logement', ['vacant', 'occupe_a_evacuer', 'en_maintenance'])->default('vacant');
            $table->enum('statut_dossier', ['draft', 'submitted_dp', 'under_review_dp', 'transmitted_aref', 'approved', 'rejected'])->default('draft');
            $table->date('date_creation');
            $table->unsignedInteger('total_bareme')->default(0);
            $table->text('reasons')->nullable();
            $table->string('numero_bordereau_dp', 50)->nullable();
            $table->date('date_transmission_aref')->nullable();
            $table->string('numero_decision_aref', 50)->nullable();
            $table->date('date_commission_aref')->nullable();
        });

        Schema::create('baremes_detail', function (Blueprint $table) {
            $table->id();
            $table->string('numero_dossier', 50);
            $table->foreign('numero_dossier')->references('numero_dossier')->on('demandes_logement')->cascadeOnDelete();
            $table->unsignedInteger('pts_anciennete_generale')->default(0);
            $table->unsignedInteger('pts_anciennete_etablissement')->default(0);
            $table->unsignedInteger('pts_echelle')->default(0);
            $table->unsignedInteger('pts_situation_familiale')->default(0);
            $table->unsignedInteger('pts_enfants')->default(0);
            $table->unsignedInteger('bonus_responsabilite')->default(0);
            $table->unsignedInteger('total_points')->default(0);
        });

        Schema::create('documents_fournis', function (Blueprint $table) {
            $table->id();
            $table->string('numero_dossier', 50);
            $table->foreign('numero_dossier')->references('numero_dossier')->on('demandes_logement')->cascadeOnDelete();
            $table->boolean('demande_manuscrite')->default(false);
            $table->boolean('copie_cin')->default(false);
            $table->boolean('attestation_travail')->default(false);
            $table->boolean('situation_familiale')->default(false);
            $table->boolean('engagement_honneur')->default(false);
            $table->boolean('pv_installation')->default(false);
            $table->date('date_verification_dp')->nullable();
        });

        Schema::create('audit_historique', function (Blueprint $table) {
            $table->id();
            $table->string('numero_dossier', 50);
            $table->foreign('numero_dossier')->references('numero_dossier')->on('demandes_logement')->cascadeOnDelete();
            $table->dateTime('date_action');
            $table->string('acteur', 100);
            $table->string('decision');
            $table->text('commentaire')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_historique');
        Schema::dropIfExists('documents_fournis');
        Schema::dropIfExists('baremes_detail');
        Schema::dropIfExists('demandes_logement');
        Schema::dropIfExists('candidats');
        Schema::dropIfExists('directions_provinciales');
    }
};
