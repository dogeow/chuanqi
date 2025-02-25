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
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('character_id');
            $table->unsignedBigInteger('item_id');
            $table->integer('quantity')->default(1);
            $table->boolean('is_equipped')->default(false);
            $table->timestamps();
            
            // 不使用外键约束，但保留索引以提高查询性能
            $table->index('character_id');
            $table->index('item_id');
            $table->unique(['character_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
