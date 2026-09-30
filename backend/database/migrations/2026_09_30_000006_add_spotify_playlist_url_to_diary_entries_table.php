<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->string('spotify_playlist_url')->nullable()->after('image_url');
        });
    }

    public function down(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->dropColumn('spotify_playlist_url');
        });
    }
};
