<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            if (!Schema::hasColumn('candidats', 'gender')) {
                $table->string('gender', 10)->nullable()->after('cin');
            }
        });
    }

    public function down(): void
    {
        Schema::table('candidats', function (Blueprint $table) {
            $table->dropColumn('gender');
        });
    }
};
