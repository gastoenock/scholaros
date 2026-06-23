<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\PlatformSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/admin', [AdminController::class, 'index'])->name('admin.index');
Route::get('/admin/settings', [PlatformSettingsController::class, 'index'])->name('admin.settings.index');
Route::put('/admin/settings', [PlatformSettingsController::class, 'update'])->name('admin.settings.update');
Route::post('/admin/applications/{application}/approve', [AdminController::class, 'approveApplication'])->name('admin.applications.approve');
Route::post('/admin/applications/{application}/reject', [AdminController::class, 'rejectApplication'])->name('admin.applications.reject');
Route::put('/admin/users/{platformUser}/role', [AdminController::class, 'updateUserRole'])->name('admin.users.role');
