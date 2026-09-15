<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\IngredientConversionController;

Route::post('/ingredients/{ingredient}/conversions', [IngredientConversionController::class, 'store'])
    ->name('ingredient-conversion.store');

Route::delete('/ingredient-conversions/{conversion}', [IngredientConversionController::class, 'destroy'])
    ->name('ingredient-conversion.destroy');
