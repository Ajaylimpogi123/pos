<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductIngredient extends Pivot
{
    

    protected $table = 'tbl_product_ingredient';
    protected $primaryKey = 'pd_ing_id';

    protected $fillable = ['pd_id', 'ing_id', 'pd_ing_qty'];
}