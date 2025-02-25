<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Monster extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'name',
        'description',
        'level',
        'hp',
        'current_hp',
        'attack',
        'defense',
        'exp_reward',
        'gold_reward',
        'respawn_time',
        'map_id',
        'position_x',
        'position_y',
        'image',
        'is_dead',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'level' => 'integer',
        'hp' => 'integer',
        'current_hp' => 'integer',
        'attack' => 'integer',
        'defense' => 'integer',
        'exp_reward' => 'integer',
        'gold_reward' => 'integer',
        'respawn_time' => 'integer',
        'is_dead' => 'boolean',
    ];
    
    /**
     * 获取怪物所在的地图
     */
    public function map()
    {
        return $this->belongsTo(Map::class);
    }
    
    /**
     * 获取怪物可掉落的物品
     */
    public function items()
    {
        return $this->belongsToMany(Item::class, 'drop_rates')
            ->withPivot('rate', 'min_quantity', 'max_quantity')
            ->withTimestamps();
    }
    
    /**
     * 获取怪物的掉落率
     */
    public function dropRates()
    {
        return $this->hasMany(DropRate::class);
    }
}
