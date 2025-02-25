<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CharacterSkill extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'character_id',
        'skill_id',
        'level',
        'last_used_at',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'level' => 'integer',
        'last_used_at' => 'datetime',
    ];
    
    /**
     * 获取此技能关联所属的角色
     */
    public function character()
    {
        return $this->belongsTo(Character::class);
    }
    
    /**
     * 获取此关联的技能
     */
    public function skill()
    {
        return $this->belongsTo(Skill::class);
    }
}
