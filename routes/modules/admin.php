<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::get('/admin', [AdminController::class, 'index'])->name('admin.index');
Route::post('/admin/applications/{application}/approve', [AdminController::class, 'approveApplication'])->name('admin.applications.approve');
Route::post('/admin/applications/{application}/reject', [AdminController::class, 'rejectApplication'])->name('admin.applications.reject');
Route::put('/admin/users/{user}/role', [AdminController::class, 'updateUserRole'])->name('admin.users.role');
