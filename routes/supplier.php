<?php
use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/supplier', [SupplierController::class, 'index'])->name('supplier.index');
    Route::post('/supplier', [SupplierController::class, 'store'])->name('supplier.store');
    Route::post('/supplier/edit/{sup_id}', [SupplierController::class, 'update'])->name('supplier.update');
    Route::delete('/supplier/{sup_id}', [SupplierController::class, 'destroy'])->name('supplier.destroy');
});
