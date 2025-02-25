<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'name',
        'description',
        'map_id',
        'position_x',
        'position_y',
        'type',
        'image',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'position_x' => 'integer',
        'position_y' => 'integer',
    ];
    
    /**
     * 获取商店所在的地图
     */
    public function map()
    {
        return $this->belongsTo(Map::class);
    }
    
    /**
     * 获取商店出售的物品
     */
    public function items()
    {
        return $this->belongsToMany(Item::class, 'shop_items')
            ->withPivot('price', 'stock')
            ->withTimestamps();
    }
    
    /**
     * 获取商店物品关联
     */
    public function shopItems()
    {
        return $this->hasMany(ShopItem::class);
    }
}
