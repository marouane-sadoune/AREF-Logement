<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $requiredTables = [
            'directions_provinciales',
            'candidats',
            'demandes_logement',
            'baremes_detail',
            'documents_fournis',
            'audit_historique',
        ];

        $missingTables = array_values(array_filter(
            $requiredTables,
            fn (string $table): bool => ! Schema::hasTable($table)
        ));

        if ($missingTables !== []) {
            throw new RuntimeException(
                'Import the existing AREF SQL schema before migrating. Missing tables: '
                . implode(', ', $missingTables)
            );
        }
    }

    public function down(): void
    {
    }
};