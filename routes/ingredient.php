<?php
use App\Http\Controllers\IngredientController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/ingredient', [IngredientController::class, 'index'])->name('ingredient.index');
    Route::post('/ingredient', [IngredientController::class, 'store'])->name('ingredient.store');
    Route::get('/ingredient/edit/{ing_id}', [IngredientController::class, 'edit'])->name('ingredient.edit');
    Route::post('/ingredient/edit/{ing_id}', [IngredientController::class, 'update'])->name('ingredient.update');
    Route::delete('/ingredient/{ing_id}', [IngredientController::class, 'destroy'])->name('ingredient.destroy');
});
