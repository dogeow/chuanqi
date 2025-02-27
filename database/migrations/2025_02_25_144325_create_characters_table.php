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
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('name');
            $table->integer('level')->default(1);
            $table->integer('exp')->default(0);
            $table->integer('base_hp')->default(100);
            $table->integer('max_hp')->default(100);
            $table->integer('current_hp')->default(100);
            $table->integer('base_mp')->default(50);
            $table->integer('max_mp')->default(50);
            $table->integer('current_mp')->default(50);
            $table->integer('attack')->default(10);
            $table->integer('base_defense')->default(0);
            $table->integer('defense')->default(5);
            $table->unsignedBigInteger('current_map_id')->default(1);
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->timestamps();
            
            // 不使用外键约束，但保留索引以提高查询性能
            $table->index('user_id');
            $table->index('current_map_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
