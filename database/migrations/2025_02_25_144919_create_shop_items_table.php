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
        Schema::create('shop_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id');
            $table->unsignedBigInteger('item_id');
            $table->integer('price')->default(0); // 商店特定价格，如果为0则使用物品默认价格
            $table->integer('stock')->default(-1); // -1表示无限库存
            $table->timestamps();
            
            // 不使用外键约束，但保留索引以提高查询性能
            $table->index('shop_id');
            $table->index('item_id');
            $table->unique(['shop_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_items');
    }
};
