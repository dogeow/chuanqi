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
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->integer('cooldown')->default(0); // 冷却时间（秒）
            $table->integer('mp_cost')->default(0); // 魔法值消耗
            $table->integer('damage')->default(0); // 基础伤害值
            $table->string('effect_type')->default('damage'); // 效果类型：damage, heal, buff, debuff
            $table->integer('effect_value')->default(0); // 效果值
            $table->integer('effect_duration')->default(0); // 效果持续时间（秒）
            $table->integer('level_required')->default(1); // 学习所需等级
            $table->string('icon')->nullable(); // 技能图标
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
