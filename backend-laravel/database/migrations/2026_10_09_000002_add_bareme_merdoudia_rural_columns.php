<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the two remaining Note 40 barème criteria that were missing from the
 * original 6-column grid: المردودية (performance) and الوسط القروي (rural).
 * Also stores the raw candidate inputs used to score them.
 */
return new class extends Migration
{
    private function columnExists(string $table, string $column): bool
    {
        return Schema::hasColumn($table, $column);
    }

    public function up(): void
    {
        Schema::table('baremes_detail', function (Blueprint $table) {
            if (!$this->columnExists('baremes_detail', 'pts_merdoudia')) {
                $table->unsignedInteger('pts_merdoudia')->default(0)->after('bonus_responsabilite');
            }
            if (!$this->columnExists('baremes_detail', 'pts_milieu_rural')) {
                $table->unsignedInteger('pts_milieu_rural')->default(0)->after('pts_merdoudia');
            }
        });

        Schema::table('candidats', function (Blueprint $table) {
            if (!$this->columnExists('candidats', 'merdoudia')) {
                $table->enum('merdoudia', ['excellent', 'good', 'satisfactory', 'below'])
                    ->default('satisfactory')->nullable()->after('nombre_enfants');
            }
            if (!$this->columnExists('candidats', 'milieu_rural')) {
                $table->boolean('milieu_rural')->default(false)->after('merdoudia');
            }
            if (!$this->columnExists('candidats', 'franchise_rurale')) {
                $table->boolean('franchise_rurale')->default(false)->after('milieu_rural');
            }
        });
    }

    public function down(): void
    {
        Schema::table('baremes_detail', function (Blueprint $table) {
            foreach (['pts_merdoudia', 'pts_milieu_rural'] as $col) {
                if ($this->columnExists('baremes_detail', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('candidats', function (Blueprint $table) {
            foreach (['merdoudia', 'milieu_rural', 'franchise_rurale'] as $col) {
                if ($this->columnExists('candidats', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
