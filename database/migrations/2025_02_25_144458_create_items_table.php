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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('type'); // weapon, armor, potion, material, etc.
            $table->string('rarity')->default('common'); // common, uncommon, rare, epic, legendary
            $table->integer('level_required')->default(1);
            $table->integer('attack_bonus')->default(0);
            $table->integer('defense_bonus')->default(0);
            $table->integer('hp_bonus')->default(0);
            $table->integer('mp_bonus')->default(0);
            $table->integer('buy_price')->default(0); // 购买价格
            $table->integer('sell_price')->default(0); // 出售价格
            $table->boolean('is_tradable')->default(true); // 是否可交易
            $table->boolean('is_consumable')->default(false); // 是否可消耗
            $table->string('image')->nullable(); // 物品图片
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
