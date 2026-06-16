<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LandlordController;
use App\Http\Middleware\ForgetTenantDomainParameter;
use App\Support\TenancyUrl;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

$centralDomain = TenancyUrl::centralDomain();

Route::domain('{schoolSlug}.'.$centralDomain)
    ->middleware([
        'web',
        InitializeTenancyBySubdomain::class,
        ForgetTenantDomainParameter::class,
        PreventAccessFromCentralDomains::class,
    ])
    ->group(function () {
        Route::get('/', fn () => redirect('/dashboard'));

        Route::middleware('guest:web')->group(function () {
            Route::get('/login', [AuthController::class, 'showTenantLogin'])->name('tenant.login');
            Route::post('/login', [AuthController::class, 'tenantLogin']);
            Route::get('/signup', [AuthController::class, 'showTenantSignup'])->name('tenant.signup');
            Route::post('/signup', [AuthController::class, 'tenantSignup']);
        });

        Route::post('/logout', [AuthController::class, 'tenantLogout'])
            ->middleware('auth:web')
            ->name('tenant.logout');

        Route::middleware(['auth:platform,web', 'tenant'])->prefix('dashboard')->group(function () {
            Route::get('/', [DashboardController::class, 'index'])->name('tenant.dashboard.index');

            Route::middleware('auth:platform')->post('/landlord/tenants/leave', [LandlordController::class, 'leave'])
                ->name('tenant.landlord.leave');

            $centralModules = [
                'dashboard.php',
                'landlord.php',
                'admin.php',
                'schools.php',
            ];

            foreach (glob(__DIR__.'/modules/*.php') as $moduleRoutes) {
                if (in_array(basename($moduleRoutes), $centralModules, true)) {
                    continue;
                }

                require $moduleRoutes;
            }
        });

        Route::fallback(fn () => redirect(TenancyUrl::centralUrl('/')));
    });
