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
}
