<?php

use Illuminate\Support\Facades\Route;

Route::middleware('print.agent.token')->prefix('print-agent')->group(function () {
    require __DIR__.'/print_agent.php';
});
