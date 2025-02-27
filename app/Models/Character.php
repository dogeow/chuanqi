<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Character extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'user_id',
        'name',
        'level',
        'exp',
        'max_hp',
        'current_hp',
        'max_mp',
        'current_mp',
        'attack',
        'defense',
        'current_map_id',
        'position_x',
        'position_y',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'level' => 'integer',
        'exp' => 'integer',
        'max_hp' => 'integer',
        'current_hp' => 'integer',
        'max_mp' => 'integer',
        'current_mp' => 'integer',
        'attack' => 'integer',
        'defense' => 'integer',
        'position_x' => 'integer',
        'position_y' => 'integer',
    ];
    
    /**
     * 获取角色所属的用户
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * 获取角色当前所在的地图
     */
    public function currentMap()
    {
        return $this->belongsTo(Map::class, 'current_map_id');
    }
    
    /**
     * 获取角色的技能
     */
    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'character_skills')
            ->withPivot('level', 'last_used_at')
            ->withTimestamps();
    }
    
    /**
     * 获取角色的背包物品
     */
    public function items()
    {
        return $this->belongsToMany(Item::class, 'inventories')
            ->withPivot('quantity', 'is_equipped')
            ->withTimestamps();
    }
    
    /**
     * 获取角色的背包
     */
    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }
    
    /**
     * 获取x坐标的访问器
     */
    public function getXAttribute()
    {
        return $this->position_x;
    }
    
    /**
     * 设置x坐标的修改器
     */
    public function setXAttribute($value)
    {
        $this->attributes['position_x'] = $value;
    }
    
    /**
     * 获取y坐标的访问器
     */
    public function getYAttribute()
    {
        return $this->position_y;
    }
    
    /**
     * 设置y坐标的修改器
     */
    public function setYAttribute($value)
    {
        $this->attributes['position_y'] = $value;
    }
    
    /**
     * 获取地图ID的访问器
     */
    public function getMapIdAttribute()
    {
        return $this->current_map_id;
    }
    
    /**
     * 设置地图ID的修改器
     */
    public function setMapIdAttribute($value)
    {
        $this->attributes['current_map_id'] = $value;
    }
    
    /**
     * 获取升级所需经验的访问器
     */
    public function getExpToLevelAttribute()
    {
        return $this->level * 100; // 简单的升级公式
    }
    
    /**
     * 获取最小攻击力的访问器
     */
    public function getAttackMinAttribute()
    {
        $rand = rand(0, 20);
        $diff = floor(($rand /100) * $this->attack);

        return $this->attack - $diff;
    }
    
    /**
     * 获取最大攻击力的访问器
     */
    public function getAttackMaxAttribute()
    {
        $rand = rand(0, 20);
        $diff = ceil(($rand / 100) * $this->attack);

        return $this->attack + $diff;
    }
    
    /**
     * 获取金币的访问器
     */
    public function getGoldAttribute()
    {
        return $this->user->gold;
    }
}
