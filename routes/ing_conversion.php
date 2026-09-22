<?php

use App\Http\Controllers\IngredientConversionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::post('/ingredients/{ingredient}/conversions', [IngredientConversionController::class, 'store'])
        ->name('ingredient-conversion.store');

    Route::delete('/ingredient-conversions/{conversion}', [IngredientConversionController::class, 'destroy'])
        ->name('ingredient-conversion.destroy');
});
