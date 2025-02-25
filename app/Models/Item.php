<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'name',
        'description',
        'type',
        'rarity',
        'level_required',
        'attack_bonus',
        'defense_bonus',
        'hp_bonus',
        'mp_bonus',
        'buy_price',
        'sell_price',
        'is_tradable',
        'is_consumable',
        'image',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'level_required' => 'integer',
        'attack_bonus' => 'integer',
        'defense_bonus' => 'integer',
        'hp_bonus' => 'integer',
        'mp_bonus' => 'integer',
        'buy_price' => 'integer',
        'sell_price' => 'integer',
        'is_tradable' => 'boolean',
        'is_consumable' => 'boolean',
    ];
    
    /**
     * 获取拥有此物品的角色
     */
    public function characters()
    {
        return $this->belongsToMany(Character::class, 'inventories')
            ->withPivot('quantity', 'is_equipped')
            ->withTimestamps();
    }
    
    /**
     * 获取可掉落此物品的怪物
     */
    public function monsters()
    {
        return $this->belongsToMany(Monster::class, 'drop_rates')
            ->withPivot('rate', 'min_quantity', 'max_quantity')
            ->withTimestamps();
    }
    
    /**
     * 获取出售此物品的商店
     */
    public function shops()
    {
        return $this->belongsToMany(Shop::class, 'shop_items')
            ->withPivot('price', 'stock')
            ->withTimestamps();
    }
    
    /**
     * 获取此物品的掉落率
     */
    public function dropRates()
    {
        return $this->hasMany(DropRate::class);
    }
}
