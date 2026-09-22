<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintJob extends Model
{
    use HasFactory;

    protected $table = 'tbl_print_job';

    protected $primaryKey = 'pj_id';

    protected $fillable = [
        'pj_type',
        'pj_printer',
        'od_id',
        'pj_payload',
        'pj_status',
        'pj_attempts',
        'pj_max_attempts',
        'pj_error',
        'pj_is_manual',
        'user_id',
        'pj_claimed_at',
        'pj_completed_at',
    ];

    protected $casts = [
        'pj_payload' => 'array',
        'pj_is_manual' => 'boolean',
        'pj_claimed_at' => 'datetime',
        'pj_completed_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'od_id', 'od_id');
    }
}
