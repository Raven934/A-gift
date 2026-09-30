<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diary_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('tag', 40);
            $table->string('date')->nullable();
            $table->text('content');
            $table->string('image_url')->nullable();
            $table->unsignedInteger('likes')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diary_entries');
    }
};
