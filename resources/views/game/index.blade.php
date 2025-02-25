<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>传奇游戏</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/app.css', 'resources/css/game.css', 'resources/js/app.js'])
    <script>
        // 从会话中获取令牌并存储到localStorage
        @if(session('game_token'))
            localStorage.setItem('game_token', '{{ session('game_token') }}');
            console.log('从会话中获取并存储令牌到localStorage');
        @endif
    </script>
</head>
<body>
    <div class="game-container">
        <div class="game-map-container">
            <div id="game-map" class="game-map">
                <div id="player" class="player"></div>
                <!-- 怪物和其他玩家会动态添加到这里 -->
            </div>
        </div>
        
        <div class="sidebar">
            <div class="section">
                <h3>角色信息</h3>
                <div id="character-details">
                    <!-- 角色信息会动态添加到这里 -->
                    <p>加载中...</p>
                </div>
            </div>
            
            <div class="section">
                <h3>技能</h3>
                <div id="skills-list">
                    <!-- 技能列表会动态添加到这里 -->
                    <p>加载中...</p>
                </div>
            </div>
            
            <div class="section">
                <h3>背包</h3>
                <div id="inventory-list">
                    <!-- 背包物品会动态添加到这里 -->
                    <p>加载中...</p>
                </div>
            </div>
            
            <div class="messages" id="messages">
                <!-- 游戏消息会动态添加到这里 -->
                <p>欢迎来到传奇游戏！</p>
            </div>
        </div>
    </div>
    
    <!-- 怪物模态框 -->
    <div id="monster-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="monster-name">怪物名称</h2>
                <span class="close">&times;</span>
            </div>
            <div id="monster-details">
                <!-- 怪物详情会动态添加到这里 -->
            </div>
            <div class="modal-actions">
                <button id="attack-monster" class="btn">攻击</button>
                <button id="use-skill" class="btn">使用技能</button>
            </div>
        </div>
    </div>
    
    <!-- 商店模态框 -->
    <div id="shop-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="shop-name">商店名称</h2>
                <span class="close">&times;</span>
            </div>
            <div id="shop-items">
                <!-- 商店物品会动态添加到这里 -->
            </div>
        </div>
    </div>
    
    <!-- 物品模态框 -->
    <div id="item-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="item-name">物品名称</h2>
                <span class="close">&times;</span>
            </div>
            <div id="item-details">
                <!-- 物品详情会动态添加到这里 -->
            </div>
            <div id="item-actions">
                <!-- 物品操作按钮会动态添加到这里 -->
            </div>
        </div>
    </div>
    
    <!-- 技能选择模态框 -->
    <div id="skill-select-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>选择技能</h2>
                <span class="close">&times;</span>
            </div>
            <div id="skill-select-list">
                <!-- 技能列表会动态添加到这里 -->
            </div>
        </div>
    </div>
    
    <!-- 修改游戏页面，在页面加载时从会话中获取令牌并存储到localStorage -->
</body>
</html> 