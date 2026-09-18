<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Cart extends Model
{
    use HasFactory;

    protected $table = 'tbl_cart';
    protected $primaryKey = 'ct_id';
    protected $fillable = [
        'pd_id',
        'ct_qty',
        'ct_price',
        'ct_date',
        'remark',
        'user_id',
        'merge_number',
        'is_done',
        'is_open',
        'is_print',
        'ct_status',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'pd_id', 'pd_id');
    }
}