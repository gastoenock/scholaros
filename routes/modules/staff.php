<?php

use App\Http\Controllers\StaffController;
use Illuminate\Support\Facades\Route;

Route::get('/staff', [StaffController::class, 'index'])->name('staff.index');
Route::get('/staff/{staff:uuid}', [StaffController::class, 'show'])->name('staff.show');
Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
Route::put('/staff/{staff:uuid}', [StaffController::class, 'update'])->name('staff.update');
Route::delete('/staff/{staff:uuid}', [StaffController::class, 'destroy'])->name('staff.destroy');
