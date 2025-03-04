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
        Schema::create('monsters', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_boss')->default(false);
            $table->text('description');
            $table->integer('level')->default(1);
            $table->integer('hp')->default(100);
            $table->integer('current_hp')->default(100); // 怪物当前生命值
            $table->integer('attack')->default(10);
            $table->integer('defense')->default(5);
            $table->integer('exp_reward')->default(10); // 击杀获得经验
            $table->integer('gold_reward')->default(5); // 击杀获得金币
            $table->integer('respawn_time')->default(60); // 重生时间（秒）
            $table->unsignedBigInteger('map_id'); // 所在地图
            $table->integer('position_x')->default(0); // 怪物X坐标
            $table->integer('position_y')->default(0); // 怪物Y坐标
            $table->string('image')->nullable(); // 怪物图片
            $table->string('emoji')->nullable(); // 怪物emoji
            $table->timestamps();
            
            // 不使用外键约束，但保留索引以提高查询性能
            $table->index('map_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monsters');
    }
};
