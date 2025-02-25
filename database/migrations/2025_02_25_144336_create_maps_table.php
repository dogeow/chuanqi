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
        Schema::create('maps', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->integer('level_required')->default(1); // 进入所需等级
            $table->string('type')->default('normal'); // 地图类型：normal, dungeon, boss
            $table->integer('width')->default(1000); // 地图宽度
            $table->integer('height')->default(1000); // 地图高度
            $table->string('background_image')->nullable(); // 背景图片
            $table->json('spawn_points')->nullable(); // 怪物刷新点JSON数据
            $table->json('teleport_points')->nullable(); // 传送点JSON数据
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maps');
    }
};
