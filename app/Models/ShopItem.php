<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopItem extends Model
{
    use HasFactory;
    
    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'shop_id',
        'item_id',
        'price',
        'stock',
    ];
    
    /**
     * 应该被转换的属性
     */
    protected $casts = [
        'price' => 'integer',
        'stock' => 'integer',
    ];
    
    /**
     * 获取此商店物品关联所属的商店
     */
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
    
    /**
     * 获取此关联的物品
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
