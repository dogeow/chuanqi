<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>欢迎 - 传奇游戏</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    <style>
        html {
            touch-action: manipulation;
        }
        body {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            font-family: 'Microsoft YaHei', sans-serif;
            background-color: #1a1a1a;
            color: #fff;
            margin: 0;
            padding: 0;
            background-image: url('/images/game-bg.jpg');
            background-size: cover;
            background-position: center;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 40px;
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            max-width: 800px;
        }
        h1 {
            font-size: 48px;
            margin-bottom: 20px;
            color: #ffcc00;
            text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
        }
        p {
            font-size: 18px;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .btn {
            display: inline-block;
            padding: 16px 32px;
            background-color: #ffcc00;
            color: #000;
            font-weight: bold;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 18px;
            margin: 10px;
            text-decoration: none;
            transition: background-color 0.3s, transform 0.3s;
        }
        .btn:hover {
            background-color: #e6b800;
            transform: translateY(-3px);
        }
        .btn-secondary {
            background-color: #444;
            color: #fff;
        }
        .btn-secondary:hover {
            background-color: #555;
        }
        .auth-buttons {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>传奇游戏</h1>
        <p>欢迎来到这个充满冒险和挑战的世界！在这里，你可以选择你的角色，探索神秘的地图，与各种怪物战斗，收集稀有物品，提升你的技能，成为最强大的勇士。</p>
        
        <div class="auth-buttons">
            @auth
                <a href="{{ route('game.index') }}" class="btn">进入游戏</a>
                <form method="POST" action="{{ route('logout') }}" style="display: inline;">
                    @csrf
                    <button type="submit" class="btn btn-secondary">登出</button>
                </form>
            @else
                <a href="{{ route('login') }}" class="btn">登录</a>
                <a href="{{ route('register') }}" class="btn btn-secondary">注册</a>
            @endauth
        </div>
    </div>
</body>
</html>
