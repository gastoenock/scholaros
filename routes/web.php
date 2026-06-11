<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchoolApplicationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Public ──────────────────────────────────────────────────────
Route::get('/', fn () => Inertia::render('index'))->name('home');

Route::get('/register', [SchoolApplicationController::class, 'create'])->name('register');
Route::post('/register', [SchoolApplicationController::class, 'store']);

// ─── Auth ────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/signup', [AuthController::class, 'showSignup'])->name('signup');
    Route::post('/signup', [AuthController::class, 'signup']);
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// ─── Dashboard modules ───────────────────────────────────────────
Route::middleware('auth')->prefix('dashboard')->group(function () {
    foreach (glob(__DIR__.'/modules/*.php') as $moduleRoutes) {
        require $moduleRoutes;
    }
});

// ─── Fallback (404 page) ─────────────────────────────────────────
Route::fallback(fn () => Inertia::render('not-found'));
