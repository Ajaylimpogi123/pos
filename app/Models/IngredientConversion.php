<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IngredientConversion extends Model
{
    protected $table = 'tbl_ingredient_conversion';
    protected $primaryKey = 'conv_id';

    protected $fillable = [
        'ing_id',
        'from_unit',
        'to_unit',
        'factor',
    ];

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class, 'ing_id', 'ing_id');
    }
}