<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>成长与冒险 - 在线游戏</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #000;
            font-family: 'Microsoft YaHei', sans-serif;
        }
        #game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #game-canvas {
            border: 1px solid #333;
            background-color: #111;
            max-width: 100%;
            max-height: 100%;
        }
        #ui-container {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            font-size: 14px;
            pointer-events: none;
        }
        #player-stats {
            background-color: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        #inventory-button, #skills-button, #shop-button {
            background-color: rgba(50, 50, 50, 0.8);
            color: white;
            border: 1px solid #555;
            padding: 5px 10px;
            margin-right: 5px;
            cursor: pointer;
            pointer-events: auto;
            border-radius: 3px;
        }
        .modal {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(30, 30, 30, 0.95);
            color: white;
            padding: 20px;
            border-radius: 5px;
            z-index: 100;
            pointer-events: auto;
            min-width: 300px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #444;
            padding-bottom: 10px;
        }
        .close-button {
            background: none;
            border: none;
            color: #aaa;
            font-size: 20px;
            cursor: pointer;
        }
        .item {
            display: flex;
            padding: 5px;
            border: 1px solid #444;
            margin-bottom: 5px;
            cursor: pointer;
        }
        .item:hover {
            background-color: #333;
        }
        .item-name {
            flex-grow: 1;
        }
        .loading-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            color: white;
            z-index: 1000;
        }
        .progress-bar {
            width: 300px;
            height: 20px;
            background-color: #333;
            margin-top: 20px;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress {
            height: 100%;
            background-color: #4CAF50;
            width: 0%;
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        
        <div id="ui-container">
            <div id="player-stats">
                <div>等级: <span id="player-level">1</span></div>
                <div>生命: <span id="player-hp">100</span>/<span id="player-max-hp">100</span></div>
                <div>经验: <span id="player-exp">0</span>/<span id="player-next-level">100</span></div>
                <div>金币: <span id="player-gold">0</span></div>
            </div>
            <button id="inventory-button">背包 [B]</button>
            <button id="skills-button">技能 [K]</button>
            <button id="shop-button">商店 [S]</button>
        </div>
        
        <!-- 背包界面 -->
        <div id="inventory-modal" class="modal">
            <div class="modal-header">
                <h3>背包</h3>
                <button class="close-button">&times;</button>
            </div>
            <div id="inventory-content"></div>
        </div>
        
        <!-- 技能界面 -->
        <div id="skills-modal" class="modal">
            <div class="modal-header">
                <h3>技能</h3>
                <button class="close-button">&times;</button>
            </div>
            <div id="skills-content"></div>
        </div>
        
        <!-- 商店界面 -->
        <div id="shop-modal" class="modal">
            <div class="modal-header">
                <h3>商店</h3>
                <button class="close-button">&times;</button>
            </div>
            <div id="shop-content"></div>
        </div>
        
        <!-- 加载界面 -->
        <div id="loading-screen" class="loading-screen">
            <h2>成长与冒险</h2>
            <p>游戏加载中...</p>
            <div class="progress-bar">
                <div id="loading-progress" class="progress"></div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.2.4/dist/pixi.min.js"></script>
    <script src="{{ asset('js/game/main.js') }}"></script>
</body>
</html> 