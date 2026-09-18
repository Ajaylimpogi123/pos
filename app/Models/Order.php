<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $table = 'tbl_order';
    protected $primaryKey = 'od_id';

    protected $fillable = [
        'cust_id',
        'queue_no',
        'invoice_no',
        'payment_method',
        'reference_no',
        'order_description',
        'od_amount_due',
        'od_discount',
        'percent_discount',
        'od_total_amt_due',
        'od_payment',
        'od_change',
        'other_charges',
        'is_open',
        'is_print',
        'od_remarks',
    ];

    protected $casts = [
        'od_amount_due' => 'decimal:2',
        'od_discount' => 'decimal:2',
        'percent_discount' => 'decimal:2',
        'od_total_amt_due' => 'decimal:2',
        'od_payment' => 'decimal:2',
        'od_change' => 'decimal:2',
        'other_charges' => 'decimal:2',
        'is_open' => 'boolean',
        'is_print' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(OrderItems::class, 'od_id', 'od_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'cust_id', 'cust_id');
    }
}