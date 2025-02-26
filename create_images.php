<?php
// 创建JPG图像函数
function createJpgImage($filename, $r, $g, $b) {
    $width = 800;
    $height = 600;
    
    // 创建空白图像
    $image = imagecreatetruecolor($width, $height);
    
    // 分配颜色
    $color = imagecolorallocate($image, $r, $g, $b);
    
    // 填充背景
    imagefill($image, 0, 0, $color);
    
    // 保存为JPG
    imagejpeg($image, $filename, 90);
    
    // 释放内存
    imagedestroy($image);
    
    echo "Created image: $filename\n";
}

// 创建PNG图像函数（较小尺寸，适合图标）
function createPngImage($filename, $r, $g, $b, $text = '') {
    $width = 64;
    $height = 64;
    
    // 创建空白图像，带透明
    $image = imagecreatetruecolor($width, $height);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    
    // 分配颜色
    $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
    $color = imagecolorallocate($image, $r, $g, $b);
    $textColor = imagecolorallocate($image, 255, 255, 255);
    
    // 填充透明背景
    imagefill($image, 0, 0, $transparent);
    
    // 绘制圆形或方形
    if (rand(0, 1) == 0) {
        // 圆形
        imagefilledellipse($image, $width/2, $height/2, $width-10, $height-10, $color);
    } else {
        // 方形
        imagefilledrectangle($image, 10, 10, $width-10, $height-10, $color);
    }
    
    // 添加文本（如果提供）
    if (!empty($text) && strlen($text) <= 2) {
        $fontSize = 5;
        $fontWidth = imagefontwidth($fontSize);
        $fontHeight = imagefontheight($fontSize);
        $textWidth = $fontWidth * strlen($text);
        $x = ($width - $textWidth) / 2;
        $y = ($height - $fontHeight) / 2;
        imagestring($image, $fontSize, $x, $y, $text, $textColor);
    }
    
    // 保存为PNG
    imagepng($image, $filename);
    
    // 释放内存
    imagedestroy($image);
    
    echo "Created image: $filename\n";
}

// 1. 创建地图图像
echo "=== 创建地图图像 ===\n";
createJpgImage('public/images/maps/starter.jpg', 100, 200, 100); // 浅绿色
createJpgImage('public/images/maps/forest.jpg', 34, 139, 34);    // 森林绿
createJpgImage('public/images/maps/cave.jpg', 80, 80, 80);       // 深灰色
createJpgImage('public/images/maps/desert.jpg', 210, 180, 140);  // 沙色

// 2. 创建怪物图像
echo "\n=== 创建怪物图像 ===\n";
createPngImage('public/images/monsters/slime.png', 0, 255, 0, 'SL');
createPngImage('public/images/monsters/goblin.png', 0, 100, 0, 'GB');
createPngImage('public/images/monsters/wolf.png', 128, 128, 128, 'WF');
createPngImage('public/images/monsters/spider.png', 0, 0, 0, 'SP');
createPngImage('public/images/monsters/bear.png', 139, 69, 19, 'BR');
createPngImage('public/images/monsters/bat.png', 75, 0, 130, 'BT');
createPngImage('public/images/monsters/golem.png', 169, 169, 169, 'GL');
createPngImage('public/images/monsters/scorpion.png', 255, 165, 0, 'SC');
createPngImage('public/images/monsters/mummy.png', 245, 222, 179, 'MM');

// 3. 创建物品图像
echo "\n=== 创建物品图像 ===\n";
createPngImage('public/images/items/health_potion.png', 255, 0, 0, 'HP');
createPngImage('public/images/items/wooden_sword.png', 139, 69, 19, 'WS');

// 4. 创建商店图像
echo "\n=== 创建商店图像 ===\n";
createPngImage('public/images/shops/general.png', 255, 215, 0, 'GS');

// 5. 创建技能图像
echo "\n=== 创建技能图像 ===\n";
createPngImage('public/images/skills/thrust.png', 255, 0, 255, 'TH');

echo "\n所有图像文件创建完成！\n"; 