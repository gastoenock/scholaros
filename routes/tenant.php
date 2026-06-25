<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AssetPublicController;
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
        Route::get('/asset/{publicUuid}', [AssetPublicController::class, 'show'])
            ->whereUuid('publicUuid')
            ->name('assets.public');

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
            Route::middleware('role:'.implode(',', config('roles.dashboard', [])))
                ->get('/', [DashboardController::class, 'index'])
                ->name('tenant.dashboard.index');

            Route::middleware('role:'.implode(',', config('roles.teacher_dashboard', ['teacher'])))
                ->get('/teacher', [DashboardController::class, 'teacher'])
                ->name('dashboard.teacher');

            Route::middleware('role:'.implode(',', config('roles.student_dashboard', ['student'])))
                ->get('/student', [DashboardController::class, 'student'])
                ->name('dashboard.student');

            Route::middleware('auth:platform')->post('/landlord/tenants/leave', [LandlordController::class, 'leave'])
                ->name('tenant.landlord.leave');

            $centralModules = [
                'dashboard.php',
                'landlord.php',
                'admin.php',
                'schools.php',
            ];

            $rbacExcluded = ['academics.php', 'finance.php'];

            $moduleRoles = config('roles.modules', []);

            foreach (glob(__DIR__.'/modules/*.php') as $moduleRoutes) {
                $basename = basename($moduleRoutes);

                if (in_array($basename, $centralModules, true) || in_array($basename, $rbacExcluded, true)) {
                    continue;
                }

                // Dot notation breaks keys like "parent-portal.php" (parsed as parent-portal → php).
                $allowedRoles = $moduleRoles[$basename] ?? ['admin'];

                if ($allowedRoles === null) {
                    require $moduleRoutes;

                    continue;
                }

                Route::middleware('role:'.implode(',', $allowedRoles))->group(function () use ($moduleRoutes) {
                    require $moduleRoutes;
                });
            }

            require __DIR__.'/modules/academics.php';
            require __DIR__.'/modules/finance.php';
        });

        Route::fallback(fn () => redirect(TenancyUrl::centralUrl('/')));
    });
