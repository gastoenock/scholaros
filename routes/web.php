<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchoolApplicationController;
use App\Http\Middleware\EnsureCentralDomain;
use App\Support\TenancyUrl;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$registerCentralRoutes = static function (): void {
    Route::get('/', fn () => Inertia::render('index'))->name('home');

    Route::get('/register', [SchoolApplicationController::class, 'create'])->name('register');
    Route::post('/register', [SchoolApplicationController::class, 'store']);

    Route::middleware('guest:platform')->group(function () {
        Route::get('/login', [AuthController::class, 'showSchoolPortal'])->name('login');
        Route::get('/login/platform', [AuthController::class, 'showPlatformLogin'])->name('login.platform');
        Route::post('/login/platform', [AuthController::class, 'platformLogin']);
    });

    Route::post('/logout', [AuthController::class, 'platformLogout'])
        ->middleware('auth:platform')
        ->name('logout');

    Route::middleware('auth:platform')->prefix('dashboard')->group(function () {
        foreach (['dashboard.php', 'landlord.php', 'admin.php', 'schools.php'] as $module) {
            require __DIR__.'/modules/'.$module;
        }
    });

    Route::fallback(fn () => Inertia::render('not-found'));
};

if (app()->environment('local')) {
    Route::middleware(EnsureCentralDomain::class)->group($registerCentralRoutes);
} else {
    Route::domain(TenancyUrl::centralDomain())
        ->middleware(EnsureCentralDomain::class)
        ->group($registerCentralRoutes);
}
