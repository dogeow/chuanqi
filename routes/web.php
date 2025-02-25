<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return view('welcome');
});

// 认证路由
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// 游戏路由（需要认证）
Route::middleware('auth')->group(function () {
    Route::get('/game', [GameController::class, 'index'])->name('game.index');
});
