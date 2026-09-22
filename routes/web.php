<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('Welcome', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });

Route::get('/', function () {
    return Inertia::render('Auth/Login', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');

})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

});

require __DIR__.'/category.php';
require __DIR__.'/product.php';

require __DIR__.'/menu.php';
require __DIR__.'/order.php';
require __DIR__.'/history.php';
require __DIR__.'/user.php';
require __DIR__.'/ingredient.php';
require __DIR__.'/customer.php';
require __DIR__.'/purchase.php';
require __DIR__.'/supplier.php';
require __DIR__.'/ing_conversion.php';
require __DIR__.'/printer.php';

// Loaded last so its guest-only GET/POST /register (the real, public
// self-registration route) wins the dispatch slot over routes/user.php's
// now-renamed (user.register) auth-gated route of the same URI —
// Laravel's RouteCollection keys routes by method+URI, so whichever
// route is registered last for a given method+URI is the one actually
// matched, regardless of route name.
require __DIR__.'/auth.php';
