<?php
use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/menu', [MenuController::class, 'menu'])->name('menu.menu');
    Route::post('/menu/cart', [MenuController::class, 'store'])->name('cart.store');
    Route::delete('/menu/cart/{cart}', [MenuController::class, 'destroy'])->name('cart.destroy');
    Route::patch('/menu/cart/{cart}', [MenuController::class, 'update'])->name('cart.update');
});