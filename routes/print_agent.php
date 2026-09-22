<?php

use App\Http\Controllers\PrintAgentController;
use Illuminate\Support\Facades\Route;

Route::post('/jobs/claim', [PrintAgentController::class, 'claim'])->name('print-agent.claim');
Route::post('/jobs/{printJob}/result', [PrintAgentController::class, 'result'])->name('print-agent.result');
Route::get('/ping', [PrintAgentController::class, 'ping'])->name('print-agent.ping');
