<?php
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/customer', [CustomerController::class, 'index'])->name('customer.index');
    Route::post('/customer', [CustomerController::class, 'store'])->name('customer.store');
    Route::post('/customer/edit/{cust_id}', [CustomerController::class, 'update'])->name('customer.update');
    Route::delete('/customer/{cust_id}', [CustomerController::class, 'destroy'])->name('customer.destroy');
});
