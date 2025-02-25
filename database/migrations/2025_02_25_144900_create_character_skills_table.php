<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('character_skills', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('character_id');
            $table->unsignedBigInteger('skill_id');
            $table->integer('level')->default(1);
            $table->timestamp('last_used_at')->nullable(); // 上次使用时间，用于计算冷却
            $table->timestamps();
            
            // 不使用外键约束，但保留索引以提高查询性能
            $table->index('character_id');
            $table->index('skill_id');
            $table->unique(['character_id', 'skill_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('character_skills');
    }
};
