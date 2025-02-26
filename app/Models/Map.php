<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Map extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'name',
        'description',
        'level_required',
        'type',
        'width',
        'height',
        'background_image',
        'spawn_points',
        'teleport_points',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'level_required' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'spawn_points' => 'array',
        'teleport_points' => 'array',
    ];
    
    /**
     * 获取在此地图上的角色
     */
    public function characters()
    {
        return $this->hasMany(Character::class, 'current_map_id');
    }
    
    /**
     * 获取此地图上的怪物
     */
    public function monsters()
    {
        return $this->hasMany(Monster::class);
    }
    
    /**
     * 获取此地图上的商店
     */
    public function shops()
    {
        return $this->hasMany(Shop::class);
    }
    
    /**
     * 添加传送点到地图
     * 
     * @param int $x 传送点X坐标
     * @param int $y 传送点Y坐标
     * @param int $targetMapId 目标地图ID
     * @param int $targetX 目标X坐标
     * @param int $targetY 目标Y坐标
     * @return bool
     */
    public function addTeleportPoint(int $x, int $y, int $targetMapId, int $targetX, int $targetY): bool
    {
        $teleportPoints = $this->teleport_points ?? [];
        
        // 添加新的传送点
        $teleportPoints[] = [
            'x' => $x,
            'y' => $y,
            'target_map_id' => $targetMapId,
            'target_x' => $targetX,
            'target_y' => $targetY
        ];
        
        // 更新地图的传送点
        $this->teleport_points = $teleportPoints;
        return $this->save();
    }
    
    /**
     * 移除传送点
     * 
     * @param int $x 传送点X坐标
     * @param int $y 传送点Y坐标
     * @return bool
     */
    public function removeTeleportPoint(int $x, int $y): bool
    {
        $teleportPoints = $this->teleport_points ?? [];
        
        // 过滤掉要删除的传送点
        $filteredPoints = array_filter($teleportPoints, function($point) use ($x, $y) {
            return !($point['x'] == $x && $point['y'] == $y);
        });
        
        // 重新索引数组
        $this->teleport_points = array_values($filteredPoints);
        return $this->save();
    }
    
    /**
     * 创建双向传送点（在两个地图之间创建互相连接的传送点）
     * 
     * @param Map $targetMap 目标地图
     * @param int $sourceX 源地图传送点X坐标
     * @param int $sourceY 源地图传送点Y坐标
     * @param int $targetX 目标地图传送点X坐标
     * @param int $targetY 目标地图传送点Y坐标
     * @return bool
     */
    public function createBidirectionalTeleport(Map $targetMap, int $sourceX, int $sourceY, int $targetX, int $targetY): bool
    {
        // 在源地图添加指向目标地图的传送点
        $sourceSuccess = $this->addTeleportPoint($sourceX, $sourceY, $targetMap->id, $targetX, $targetY);
        
        // 在目标地图添加指向源地图的传送点
        $targetSuccess = $targetMap->addTeleportPoint($targetX, $targetY, $this->id, $sourceX, $sourceY);
        
        return $sourceSuccess && $targetSuccess;
    }
}
