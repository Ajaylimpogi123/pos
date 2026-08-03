<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ingredient extends Model
{
    use HasFactory;
    use SoftDeletes;
    protected $table = 'tbl_ingredient';
    protected $primaryKey = 'ing_id';
    protected $fillable = [
        'ing_name',
        'branch_id',
        'ing_qty',
        'ing_mqty',
        'ing_cost',
        'unit',
        'ing_image',
        'ing_status',
    ];

  public function products()
    {
        return $this->belongsToMany(Product::class, 'tbl_product_ingredient', 'ing_id', 'pd_id')
                    ->withPivot('pd_ing_qty')
                    ->withTimestamps();
    }
}
