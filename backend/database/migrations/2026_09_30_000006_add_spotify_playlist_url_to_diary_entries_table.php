<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Add a little place to keep a Spotify playlist or song link.
    public function up(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->string('spotify_playlist_url')->nullable()->after('image_url');
        });
    }

    // Remove that place again if we ever roll this change back.
    public function down(): void
    {
        Schema::table('diary_entries', function (Blueprint $table): void {
            $table->dropColumn('spotify_playlist_url');
        });
    }
};
