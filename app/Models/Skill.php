<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'name',
        'description',
        'cooldown',
        'mp_cost',
        'damage',
        'effect_type',
        'effect_value',
        'effect_duration',
        'level_required',
        'icon',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'cooldown' => 'integer',
        'mp_cost' => 'integer',
        'damage' => 'integer',
        'effect_value' => 'integer',
        'effect_duration' => 'integer',
        'level_required' => 'integer',
    ];
    
    /**
     * 获取拥有此技能的角色
     */
    public function characters()
    {
        return $this->belongsToMany(Character::class, 'character_skills')
            ->withPivot('level', 'last_used_at')
            ->withTimestamps();
    }
}
