<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

Route::get('/', function () {
    return view('welcome');
});

// 游戏路由
Route::get('/game', [GameController::class, 'index'])->name('game.index');
