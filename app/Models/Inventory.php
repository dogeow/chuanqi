<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'character_id',
        'item_id',
        'quantity',
        'is_equipped',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'quantity' => 'integer',
        'is_equipped' => 'boolean',
    ];
    
    /**
     * 获取此背包项所属的角色
     */
    public function character()
    {
        return $this->belongsTo(Character::class);
    }
    
    /**
     * 获取此背包项的物品
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
