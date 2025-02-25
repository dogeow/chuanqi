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
        Schema::create('drop_rates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('monster_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('rate', 5, 2)->default(0); // 爆率百分比，如5.25表示5.25%
            $table->integer('min_quantity')->default(1); // 最小掉落数量
            $table->integer('max_quantity')->default(1); // 最大掉落数量
            $table->timestamps();
            
            // 不使用外键约束，但保留索引以提高查询性能
            $table->index('monster_id');
            $table->index('item_id');
            $table->unique(['monster_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('drop_rates');
    }
};
