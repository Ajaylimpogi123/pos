<?php

use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\PurchaseOrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {

    // Combined tabbed page (Purchase Requests / Purchase Orders / Logs)
    // Lives outside both resources since it's not really "just" a PR or PO index.
    Route::get('purchasing', [PurchaseRequestController::class, 'index'])
        ->name('purchasing.index');

    Route::resource('purchase-requests', PurchaseRequestController::class)
        ->except(['index']);
    Route::post('purchase-requests/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve'])
        ->name('purchase-requests.approve');
    Route::post('purchase-requests/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject'])
        ->name('purchase-requests.reject');

    Route::resource('purchase-orders', PurchaseOrderController::class)
        ->except(['index']);
    Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])
        ->name('purchase-orders.approve');
    Route::post('purchase-orders/{purchaseOrder}/reject', [PurchaseOrderController::class, 'reject'])
        ->name('purchase-orders.reject');
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])
        ->name('purchase-orders.receive');

        // routes/web.php
Route::post('purchase-orders/{purchaseOrder}/items/{item}/receive', [PurchaseOrderController::class, 'receiveItem'])
    ->name('purchase-order-items.receive');
});