<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->boolean('is_favorite')->default(false);
        });

        Schema::table('envelopes', function (Blueprint $table): void {
            $table->boolean('is_favorite')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->dropColumn('is_favorite');
        });

        Schema::table('envelopes', function (Blueprint $table): void {
            $table->dropColumn('is_favorite');
        });
    }
};
