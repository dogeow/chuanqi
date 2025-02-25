<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class GameController extends Controller
{
    /**
     * 显示游戏页面
     */
    public function index()
    {
        return view('game.index');
    }
} 