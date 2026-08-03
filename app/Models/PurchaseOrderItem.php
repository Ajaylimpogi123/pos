<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $table = 'tbl_purchase_order_items';

    protected $fillable = [
        'purchase_order_id',
        'ingredient_id',
        'item_name',
        'unit',
        'quantity',
        'unit_price',
        'subtotal',
        'quantity_received',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'quantity_received' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::saving(function (PurchaseOrderItem $item) {
            $item->subtotal = $item->quantity * $item->unit_price;
        });
    }

    // --- Relationships ---

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id', 'ing_id');
    }
}