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
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->unsignedBigInteger('map_id');
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->string('type')->default('general'); // general, weapon, armor, potion, etc.
            $table->string('image')->nullable(); // 商店图片
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
        Schema::dropIfExists('shops');
    }
};
