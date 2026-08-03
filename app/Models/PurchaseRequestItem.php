<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestItem extends Model
{
    use HasFactory;

    protected $table = 'tbl_purchase_request_items';

    protected $fillable = [
        'purchase_request_id',
        'ingredient_id',
        'item_name',
        'unit',
        'quantity',
        'estimated_unit_price',
        'remarks',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'estimated_unit_price' => 'decimal:2',
    ];

    // --- Relationships ---

    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class, 'purchase_request_id');
    }

    public function ingredient(): BelongsTo
    {

        return $this->belongsTo(Ingredient::class, 'ingredient_id', 'ing_id');
    }
}