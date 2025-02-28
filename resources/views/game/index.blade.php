<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>传奇游戏</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/app.css', 'resources/css/game.css', 'resources/js/app.jsx'])
    <script>
        // 从会话中获取令牌并存储到localStorage
        @if(session('game_token'))
            localStorage.setItem('game_token', '{{ session('game_token') }}');
            console.log('从会话中获取并存储令牌到localStorage');
        @endif
    </script>
</head>
<body>
    <!-- React将在这个容器中渲染游戏UI -->
    <div id="game-container"></div>
</body>
</html> 