# 游戏介绍

不烧脑的角色养成游戏，适合快节奏的都市群体玩家放松、怀旧、聊天。

主要目标：

1. 画面、文字比例协调。
2. 按钮、逻辑的交互简单、高效。
3. 哪些需要显示，哪些不需要显示，恰到好处。（提供 DIY 设置）。
4. 符合主流角色养成游戏的功能点。
5. 使用 Emoji 来暂时替代图片。

# PowerBy

1. Laravel + Reverb
2. React
3. Emotion
4. Tailwind CSS
5. Axios

# 缺失点

1. 没有图片
2. 没有声音

# 部署、启动

php artisan reverb:start
php artisan queue:listen
npm run dev
php artisan serve

# TODO

- 自动攻击
- 技能释放展示
- 小地图展示完整
- 玩家和怪物血条一致
- 血条和魔法值使用圆圈
- 经验值使用长条
- 金币显示符号而已，攻击力、防御也是
- PC、移动适配
- 使用 swoole
- 物品装备
- 添加拍卖行
- 召唤宠物
- 释放技能时候的展示
- 仓库
- 增加好友系统
- 组队
- 帮派
- 任务系统
- 宝石系统
- buff