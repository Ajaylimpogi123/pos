<?php

use App\Http\Controllers\PrinterController;
use App\Http\Controllers\PrintJobStatusController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/printer', [PrinterController::class, 'index'])->name('printer.index');
    Route::post('/printer/{name}/test', [PrinterController::class, 'test'])->name('printer.test');
    Route::get('/print-jobs', [PrintJobStatusController::class, 'index'])->name('print-jobs.status');
    Route::post('/print-jobs/{printJob}/retry', [PrintJobStatusController::class, 'retry'])->name('print-jobs.retry');
});
