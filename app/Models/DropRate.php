<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DropRate extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'monster_id',
        'item_id',
        'rate',
        'min_quantity',
        'max_quantity',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'rate' => 'decimal:2',
        'min_quantity' => 'integer',
        'max_quantity' => 'integer',
    ];
    
    /**
     * 获取此掉落率所属的怪物
     */
    public function monster()
    {
        return $this->belongsTo(Monster::class);
    }
    
    /**
     * 获取此掉落率的物品
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
