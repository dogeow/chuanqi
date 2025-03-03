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
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sender_id')->comment('发送者ID');
            $table->string('content')->comment('聊天内容');
            $table->string('type')->default('world')->comment('聊天类型：world-世界聊天，private-私聊');
            $table->unsignedBigInteger('receiver_id')->nullable()->comment('接收者ID（私聊时使用）');
            $table->timestamps();
            
            $table->index('sender_id');
            $table->index('receiver_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
