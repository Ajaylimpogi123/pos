<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrderItemIngredient extends Model
{
    use HasFactory;

    protected $table = 'tbl_order_item_ingredients';
    protected $primaryKey = 'oii_id';

    protected $fillable = [
        'oid_id',   // Foreign key to tbl_order_items
        'ing_id',   // Foreign key to tbl_ingredient
        'oii_qty',  // Quantity consumed for this order item (snapshot, not live stock)
        'unit',
    ];

    protected $casts = [
        'oii_qty' => 'decimal:2',
    ];

    public function orderItem()
    {
        return $this->belongsTo(OrderItems::class, 'oid_id', 'oid_id');
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class, 'ing_id', 'ing_id');
    }

    
}